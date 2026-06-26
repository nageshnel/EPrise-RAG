package com.v76.gems.orchestrator;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.model.Generation;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock RetrievalClient retrievalClient;
    @Mock PromptBuilder promptBuilder;
    @Mock TextGenerationClient textGenerationClient;
    @Mock ObjectMapper objectMapper;

    @InjectMocks ChatService chatService;

    private RetrievedChunk chunk(UUID chunkId, UUID sourceId, int seq) {
        return new RetrievedChunk(chunkId, sourceId, "DOCUMENT", seq, "content " + seq, 0.05, Map.of("k", "v"));
    }

    // -----------------------------------------------------------------------
    // chat() — happy path
    // -----------------------------------------------------------------------

    @Test
    void chat_validRequest_returnsAnswerWithSources() {
        UUID chunkId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();
        RetrievedChunk c = chunk(chunkId, sourceId, 1);
        RetrieveResponse retrieveResponse = new RetrieveResponse(List.of(c));

        ChatRequest request = new ChatRequest("What is AI?");

        when(retrievalClient.retrieve("What is AI?")).thenReturn(retrieveResponse);
        when(promptBuilder.build(eq("What is AI?"), anyList())).thenReturn("built-prompt");
        when(textGenerationClient.complete("built-prompt")).thenReturn("AI is intelligence.");

        com.v76.gems.orchestrator.ChatResponse response = chatService.chat(request);

        assertThat(response.answer()).isEqualTo("AI is intelligence.");
        assertThat(response.sources()).hasSize(1);

        SourceCitation citation = response.sources().get(0);
        assertThat(citation.chunkId()).isEqualTo(chunkId);
        assertThat(citation.sourceId()).isEqualTo(sourceId);
        assertThat(citation.sourceType()).isEqualTo("DOCUMENT");
        assertThat(citation.sequence()).isEqualTo(1);
    }

    // -----------------------------------------------------------------------
    // chat() — null retrieval response → empty sources
    // -----------------------------------------------------------------------

    @Test
    void chat_nullRetrievalResponse_returnsEmptySourceList() {
        when(retrievalClient.retrieve(anyString())).thenReturn(null);
        when(promptBuilder.build(anyString(), eq(List.of()))).thenReturn("prompt");
        when(textGenerationClient.complete("prompt")).thenReturn("I don't know.");

        com.v76.gems.orchestrator.ChatResponse response = chatService.chat(new ChatRequest("?"));

        assertThat(response.sources()).isEmpty();
        assertThat(response.answer()).isEqualTo("I don't know.");
    }

    // -----------------------------------------------------------------------
    // chat() — zero chunks
    // -----------------------------------------------------------------------

    @Test
    void chat_emptyChunks_promptBuiltWithEmptyList() {
        when(retrievalClient.retrieve(anyString())).thenReturn(new RetrieveResponse(List.of()));
        when(promptBuilder.build(anyString(), eq(List.of()))).thenReturn("empty-prompt");
        when(textGenerationClient.complete("empty-prompt")).thenReturn("No info.");

        chatService.chat(new ChatRequest("unknown topic"));

        verify(promptBuilder).build("unknown topic", List.of());
    }

    // -----------------------------------------------------------------------
    // chat() — source citation fields mapped correctly
    // -----------------------------------------------------------------------

    @Test
    void chat_sourceCitationsContainMetadata() {
        UUID chunkId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();
        RetrievedChunk c = new RetrievedChunk(chunkId, sourceId, "MEDIA", 3,
                "content", 0.02, Map.of("filename", "lecture.mp3"));
        when(retrievalClient.retrieve(anyString())).thenReturn(new RetrieveResponse(List.of(c)));
        when(promptBuilder.build(anyString(), anyList())).thenReturn("p");
        when(textGenerationClient.complete("p")).thenReturn("answer");

        com.v76.gems.orchestrator.ChatResponse response = chatService.chat(new ChatRequest("q"));

        SourceCitation citation = response.sources().get(0);
        assertThat(citation.sourceType()).isEqualTo("MEDIA");
        assertThat(citation.sequence()).isEqualTo(3);
        assertThat(citation.metadata()).containsEntry("filename", "lecture.mp3");
    }

    // -----------------------------------------------------------------------
    // streamChat() — SSE event ordering: sources → content → done
    // -----------------------------------------------------------------------

    @Test
    void streamChat_validRequest_emitsSourcesThenContentThenDone() throws Exception {
        UUID chunkId = UUID.randomUUID();
        RetrievedChunk c = chunk(chunkId, UUID.randomUUID(), 1);
        when(retrievalClient.retrieve(anyString())).thenReturn(new RetrieveResponse(List.of(c)));
        when(promptBuilder.build(anyString(), anyList())).thenReturn("stream-prompt");
        when(objectMapper.writeValueAsString(anyList())).thenReturn("[{\"chunkId\":\"" + chunkId + "\"}]");

        // Build a mock ChatResponse with a token
        org.springframework.ai.chat.model.ChatResponse aiResponse = mock(org.springframework.ai.chat.model.ChatResponse.class);
        Generation generation = mock(Generation.class);
        org.springframework.ai.chat.messages.AssistantMessage outputMsg = mock(org.springframework.ai.chat.messages.AssistantMessage.class);
        when(aiResponse.getResult()).thenReturn(generation);
        when(generation.getOutput()).thenReturn(outputMsg);
        when(outputMsg.getText()).thenReturn("token1");

        // contentEvents.count().block() will drain the flux, so we return a cold Flux
        when(textGenerationClient.stream("stream-prompt"))
                .thenReturn(Flux.just(aiResponse))
                .thenReturn(Flux.just(aiResponse)); // second subscription for concat

        Flux<ServerSentEvent<String>> resultFlux = chatService.streamChat(new ChatRequest("stream me"));

        StepVerifier.create(resultFlux)
                .assertNext(event -> assertThat(event.event()).isEqualTo("sources"))
                .assertNext(event -> {
                    assertThat(event.event()).isEqualTo("content");
                    assertThat(event.data()).isEqualTo("token1");
                })
                .assertNext(event -> assertThat(event.event()).isEqualTo("done"))
                .verifyComplete();
    }

    // -----------------------------------------------------------------------
    // streamChat() — null retrieval → empty sources event
    // -----------------------------------------------------------------------

    @Test
    void streamChat_nullRetrievalResponse_emitsEmptySourcesEvent() throws Exception {
        when(retrievalClient.retrieve(anyString())).thenReturn(null);
        when(promptBuilder.build(anyString(), eq(List.of()))).thenReturn("prompt");
        when(objectMapper.writeValueAsString(eq(List.of()))).thenReturn("[]");

        org.springframework.ai.chat.model.ChatResponse aiResponse = mock(org.springframework.ai.chat.model.ChatResponse.class);
        Generation generation = mock(Generation.class);
        org.springframework.ai.chat.messages.AssistantMessage msg = mock(org.springframework.ai.chat.messages.AssistantMessage.class);
        when(aiResponse.getResult()).thenReturn(generation);
        when(generation.getOutput()).thenReturn(msg);
        when(msg.getText()).thenReturn("answer");

        when(textGenerationClient.stream("prompt"))
                .thenReturn(Flux.just(aiResponse))
                .thenReturn(Flux.just(aiResponse));

        Flux<ServerSentEvent<String>> resultFlux = chatService.streamChat(new ChatRequest("?"));

        StepVerifier.create(resultFlux)
                .assertNext(event -> {
                    assertThat(event.event()).isEqualTo("sources");
                    assertThat(event.data()).isEqualTo("[]");
                })
                .assertNext(event -> assertThat(event.event()).isEqualTo("content"))
                .assertNext(event -> assertThat(event.event()).isEqualTo("done"))
                .verifyComplete();
    }
}
