package com.v76.gems.orchestrator;

import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;
import org.apache.skywalking.apm.toolkit.trace.ActiveSpan;
import org.apache.skywalking.apm.toolkit.trace.Trace;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Objects;

@Service
public class ChatService {
        private final RetrievalClient retrievalClient;
        private final PromptBuilder promptBuilder;
        private final TextGenerationClient textGenerationClient;
        private final ObjectMapper objectMapper;

        public ChatService(@NonNull RetrievalClient retrievalClient, @NonNull PromptBuilder promptBuilder,
                        @NonNull TextGenerationClient textGenerationClient, ObjectMapper objectMapper) {
                this.retrievalClient = Objects.requireNonNull(retrievalClient);
                this.promptBuilder = Objects.requireNonNull(promptBuilder);
                this.textGenerationClient = Objects.requireNonNull(textGenerationClient);
                this.objectMapper = Objects.requireNonNull(objectMapper);
        }

        @Trace
        public ChatResponse chat(@NonNull ChatRequest request) {
                Objects.requireNonNull(request);
                long totalStart = System.currentTimeMillis();

                long searchStart = System.currentTimeMillis();
                RetrieveResponse retrieveResponse = retrievalClient.retrieve(request.question());
                long searchDuration = System.currentTimeMillis() - searchStart;

                List<RetrievedChunk> chunks = retrieveResponse == null || retrieveResponse.chunks() == null ? List.of()
                                : retrieveResponse.chunks();
                String prompt = promptBuilder.build(request.question(), chunks);
                String answer = textGenerationClient.complete(prompt);

                List<SourceCitation> sources = chunks.stream()
                                .map(chunk -> new SourceCitation(chunk.chunkId(), chunk.sourceId(), chunk.sourceType(),
                                                chunk.sequence(), chunk.metadata()))
                                .toList();

                long totalDuration = System.currentTimeMillis() - totalStart;

                ActiveSpan.tag("search.time_ms", String.valueOf(searchDuration));
                ActiveSpan.tag("rag.latency_ms", String.valueOf(totalDuration));
                ActiveSpan.tag("document.chunks_retrieved", String.valueOf(chunks.size()));

                return new ChatResponse(answer, sources);
        }

        @Trace
        public reactor.core.publisher.Flux<org.springframework.http.codec.ServerSentEvent<String>> streamChat(
                        @NonNull ChatRequest request) {
                Objects.requireNonNull(request);
                long searchStart = System.currentTimeMillis();
                RetrieveResponse retrieveResponse = retrievalClient.retrieve(request.question());
                long searchDuration = System.currentTimeMillis() - searchStart;

                List<RetrievedChunk> chunks = retrieveResponse == null || retrieveResponse.chunks() == null ? List.of()
                                : retrieveResponse.chunks();
                String prompt = promptBuilder.build(request.question(), chunks);

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
                        sourcesJson = "[]";
                }

                final String finalSourcesJson = sourcesJson;

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
                                        return org.springframework.http.codec.ServerSentEvent.<String>builder()
                                                        .event("content")
                                                        .data(token)
                                                        .build();
                                });

                reactor.core.publisher.Flux<org.springframework.http.codec.ServerSentEvent<String>> doneEvent = reactor.core.publisher.Flux
                                .just(
                                                org.springframework.http.codec.ServerSentEvent.<String>builder()
                                                                .event("done")
                                                                .data("{}")
                                                                .build());

                return reactor.core.publisher.Flux.concat(sourcesEvent, contentEvents, doneEvent);
        }
}
