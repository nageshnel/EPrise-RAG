package com.v76.eprise.orchestrator;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    @Mock ChatService chatService;

    @InjectMocks ChatController controller;

    // -----------------------------------------------------------------------
    // chat()
    // -----------------------------------------------------------------------

    @Test
    void chat_validRequest_returnsServiceResponse() {
        ChatRequest request = new ChatRequest("What is AI?", null);
        java.util.UUID userId = java.util.UUID.randomUUID();
        ChatResponse expected = new ChatResponse("AI is intelligence.", List.of(), null);

        when(chatService.chat(eq(userId), eq(request))).thenReturn(expected);

        ChatResponse actual = controller.chat(userId.toString(), request);

        assertThat(actual).isEqualTo(expected);
        verify(chatService).chat(eq(userId), eq(request));
    }

    @Test
    void chat_delegatesExactlyOnce() {
        ChatRequest request = new ChatRequest("test", null);
        java.util.UUID userId = java.util.UUID.randomUUID();
        when(chatService.chat(eq(userId), eq(request))).thenReturn(new ChatResponse("ok", List.of(), null));

        controller.chat(userId.toString(), request);

        verify(chatService, times(1)).chat(eq(userId), eq(request));
    }

    // -----------------------------------------------------------------------
    // streamChat()
    // -----------------------------------------------------------------------

    @Test
    void streamChat_validRequest_returnsFluxFromService() {
        ChatRequest request = new ChatRequest("stream this", null);
        java.util.UUID userId = java.util.UUID.randomUUID();
        Flux<ServerSentEvent<String>> mockFlux = Flux.just(
                ServerSentEvent.<String>builder().event("sources").data("[]").build(),
                ServerSentEvent.<String>builder().event("done").data("{}").build()
        );

        when(chatService.streamChat(eq(userId), eq(request))).thenReturn(mockFlux);

        Flux<ServerSentEvent<String>> result = controller.streamChat(userId.toString(), request);

        assertThat(result).isSameAs(mockFlux);
        verify(chatService).streamChat(eq(userId), eq(request));
    }
}
