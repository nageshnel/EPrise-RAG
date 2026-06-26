package com.v76.gems.orchestrator;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.codec.ServerSentEvent;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    @Mock ChatService chatService;

    @InjectMocks ChatController controller;

    // -----------------------------------------------------------------------
    // chat()
    // -----------------------------------------------------------------------

    @Test
    void chat_validRequest_returnsServiceResponse() {
        ChatRequest request = new ChatRequest("What is AI?");
        ChatResponse expected = new ChatResponse("AI is intelligence.", List.of());

        when(chatService.chat(request)).thenReturn(expected);

        ChatResponse actual = controller.chat(request);

        assertThat(actual).isEqualTo(expected);
        verify(chatService).chat(request);
    }

    @Test
    void chat_delegatesExactlyOnce() {
        ChatRequest request = new ChatRequest("test");
        when(chatService.chat(request)).thenReturn(new ChatResponse("ok", List.of()));

        controller.chat(request);

        verify(chatService, times(1)).chat(request);
    }

    // -----------------------------------------------------------------------
    // streamChat()
    // -----------------------------------------------------------------------

    @Test
    void streamChat_validRequest_returnsFluxFromService() {
        ChatRequest request = new ChatRequest("stream this");
        Flux<ServerSentEvent<String>> mockFlux = Flux.just(
                ServerSentEvent.<String>builder().event("sources").data("[]").build(),
                ServerSentEvent.<String>builder().event("done").data("{}").build()
        );

        when(chatService.streamChat(request)).thenReturn(mockFlux);

        Flux<ServerSentEvent<String>> result = controller.streamChat(request);

        assertThat(result).isSameAs(mockFlux);
        verify(chatService).streamChat(request);
    }
}
