package com.v76.eprise.orchestrator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;
import org.apache.skywalking.apm.toolkit.trace.ActiveSpan;
import org.apache.skywalking.apm.toolkit.trace.Trace;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class ChatService {
        private static final Logger log = LoggerFactory.getLogger(ChatService.class);
        private final RetrievalClient retrievalClient;
        private final PromptBuilder promptBuilder;
        private final TextGenerationClient textGenerationClient;
        private final ObjectMapper objectMapper;
        private final ChatSessionRepository sessionRepository;
        private final ChatMessageRepository messageRepository;

        public ChatService(@NonNull RetrievalClient retrievalClient, @NonNull PromptBuilder promptBuilder,
                        @NonNull TextGenerationClient textGenerationClient, ObjectMapper objectMapper,
                        ChatSessionRepository sessionRepository, ChatMessageRepository messageRepository) {
                this.retrievalClient = Objects.requireNonNull(retrievalClient);
                this.promptBuilder = Objects.requireNonNull(promptBuilder);
                this.textGenerationClient = Objects.requireNonNull(textGenerationClient);
                this.objectMapper = Objects.requireNonNull(objectMapper);
                this.sessionRepository = Objects.requireNonNull(sessionRepository);
                this.messageRepository = Objects.requireNonNull(messageRepository);
        }

        private ChatSession resolveSession(UUID userId, UUID sessionId, String firstQuestion) {
                if (sessionId != null) {
                        return sessionRepository.findById(sessionId)
                                .filter(s -> s.userId().equals(userId))
                                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                                        org.springframework.http.HttpStatus.FORBIDDEN, "Invalid session or access denied"));
                } else {
                        String title = firstQuestion.length() > 40 
                                ? firstQuestion.substring(0, 37) + "..." 
                                : firstQuestion;
                        ChatSession newSession = new ChatSession(null, userId, title, Instant.now(), Instant.now());
                        return sessionRepository.save(newSession);
                }
        }

        private List<ChatMessage> getChronologicalHistory(UUID sessionId) {
                List<ChatMessage> recent = messageRepository.findRecentBySessionId(sessionId, 10);
                List<ChatMessage> history = new java.util.ArrayList<>(recent);
                java.util.Collections.reverse(history);
                return history;
        }

        @Trace
        public ChatResponse chat(UUID userId, @NonNull ChatRequest request) {
                Objects.requireNonNull(request);
                log.info("Starting blocking chat RAG pipeline for user {} and question: '{}'", userId, request.question());
                long totalStart = System.currentTimeMillis();

                ChatSession session = resolveSession(userId, request.sessionId(), request.question());
                UUID resolvedSessionId = session.id();

                List<ChatMessage> history = getChronologicalHistory(resolvedSessionId);

                messageRepository.save(new ChatMessage(null, resolvedSessionId, "USER", request.question(), "[]", Instant.now()));

                long searchStart = System.currentTimeMillis();
                log.debug("Querying retrieval service for context...");
                RetrieveResponse retrieveResponse = retrievalClient.retrieve(request.question());
                long searchDuration = System.currentTimeMillis() - searchStart;

                List<RetrievedChunk> chunks = retrieveResponse == null || retrieveResponse.chunks() == null ? List.of()
                                : retrieveResponse.chunks();
                log.info("Retrieved {} context chunks in {} ms", chunks.size(), searchDuration);

                log.debug("Assembling RAG prompt context...");
                String prompt = promptBuilder.build(request.question(), chunks, history);

                log.debug("Requesting answer generation from LLM model...");
                String answer = textGenerationClient.complete(prompt);

                List<SourceCitation> sources = chunks.stream()
                                .map(chunk -> new SourceCitation(chunk.chunkId(), chunk.sourceId(), chunk.sourceType(),
                                                chunk.sequence(), chunk.metadata()))
                                .toList();

                String citationsJson;
                try {
                        citationsJson = objectMapper.writeValueAsString(sources);
                } catch (Exception e) {
                        citationsJson = "[]";
                }

                messageRepository.save(new ChatMessage(null, resolvedSessionId, "ASSISTANT", answer, citationsJson, Instant.now()));
                sessionRepository.save(new ChatSession(resolvedSessionId, userId, session.title(), session.createdAt(), Instant.now()));

                long totalDuration = System.currentTimeMillis() - totalStart;
                log.info("RAG chat pipeline finished in {} ms (LLM latency: {} ms)", totalDuration, totalDuration - searchDuration);

                ActiveSpan.tag("search.time_ms", String.valueOf(searchDuration));
                ActiveSpan.tag("rag.latency_ms", String.valueOf(totalDuration));
                ActiveSpan.tag("document.chunks_retrieved", String.valueOf(chunks.size()));

                return new ChatResponse(answer, sources, resolvedSessionId);
        }

        @Trace
        public reactor.core.publisher.Flux<org.springframework.http.codec.ServerSentEvent<String>> streamChat(
                        UUID userId, @NonNull ChatRequest request) {
                Objects.requireNonNull(request);
                log.info("Starting streaming chat RAG pipeline for user {} and question: '{}'", userId, request.question());

                ChatSession session = resolveSession(userId, request.sessionId(), request.question());
                UUID resolvedSessionId = session.id();

                List<ChatMessage> history = getChronologicalHistory(resolvedSessionId);

                messageRepository.save(new ChatMessage(null, resolvedSessionId, "USER", request.question(), "[]", Instant.now()));

                long searchStart = System.currentTimeMillis();
                log.debug("Querying retrieval service for context...");
                RetrieveResponse retrieveResponse = retrievalClient.retrieve(request.question());
                long searchDuration = System.currentTimeMillis() - searchStart;

                List<RetrievedChunk> chunks = retrieveResponse == null || retrieveResponse.chunks() == null ? List.of()
                                : retrieveResponse.chunks();
                log.info("Retrieved {} context chunks in {} ms", chunks.size(), searchDuration);

                log.debug("Assembling RAG prompt context...");
                String prompt = promptBuilder.build(request.question(), chunks, history);

                List<SourceCitation> sources = chunks.stream()
                                .map(chunk -> new SourceCitation(chunk.chunkId(), chunk.sourceId(), chunk.sourceType(),
                                                chunk.sequence(), chunk.metadata()))
                                .toList();

                ActiveSpan.tag("search.time_ms", String.valueOf(searchDuration));
                ActiveSpan.tag("document.chunks_retrieved", String.valueOf(chunks.size()));

                String sourcesJson;
                try {
                        sourcesJson = objectMapper.writeValueAsString(sources);
                } catch (Exception e) {
                        log.error("Failed to serialize citations for stream event", e);
                        sourcesJson = "[]";
                }

                final String finalSourcesJson = sourcesJson;
                final StringBuilder answerAccumulator = new StringBuilder();

                log.debug("Emitting sources metadata event and subscribing to LLM text generation stream...");
                reactor.core.publisher.Flux<org.springframework.http.codec.ServerSentEvent<String>> sourcesEvent = reactor.core.publisher.Flux
                                .just(
                                                org.springframework.http.codec.ServerSentEvent.<String>builder()
                                                                .event("sources")
                                                                .data(finalSourcesJson)
                                                                .build());
                reactor.core.publisher.Flux<org.springframework.http.codec.ServerSentEvent<String>> contentEvents = textGenerationClient
                                .stream(prompt)
                                .map(chatResponse -> {
                                        String token = chatResponse.getResult() != null
                                                        ? chatResponse.getResult().getOutput().getText()
                                                        : "";
                                        answerAccumulator.append(token);
                                        return org.springframework.http.codec.ServerSentEvent.<String>builder()
                                                        .event("content")
                                                        .data(token)
                                                        .build();
                                })
                                .doOnComplete(() -> {
                                        log.info("Finished streaming LLM response tokens. Saving to DB...");
                                        try {
                                                messageRepository.save(new ChatMessage(null, resolvedSessionId, "ASSISTANT", 
                                                                answerAccumulator.toString(), finalSourcesJson, Instant.now()));
                                                sessionRepository.save(new ChatSession(resolvedSessionId, userId, session.title(), session.createdAt(), Instant.now()));
                                        } catch (Exception e) {
                                                log.error("Failed to save streaming response to database", e);
                                        }
                                });

                String donePayload = "{\"sessionId\":\"" + resolvedSessionId.toString() + "\"}";
                reactor.core.publisher.Flux<org.springframework.http.codec.ServerSentEvent<String>> doneEvent = reactor.core.publisher.Flux
                                .just(
                                                org.springframework.http.codec.ServerSentEvent.<String>builder()
                                                                .event("done")
                                                                .data(donePayload)
                                                                .build());

                return reactor.core.publisher.Flux.concat(sourcesEvent, contentEvents, doneEvent);
        }
}
