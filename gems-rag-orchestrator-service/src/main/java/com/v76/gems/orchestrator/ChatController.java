package com.v76.gems.orchestrator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.lang.NonNull;

@RestController
@RequestMapping("/chat")
public class ChatController {
    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatResponse chat(@RequestBody @NonNull ChatRequest request) {
        log.info("Received request for blocking chat: '{}'", request.question());
        ChatResponse response = chatService.chat(request);
        log.info("Blocking chat response generated (citations: {})", response.sources() != null ? response.sources().size() : 0);
        return response;
    }

    @PostMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public reactor.core.publisher.Flux<org.springframework.http.codec.ServerSentEvent<String>> streamChat(@RequestBody @NonNull ChatRequest request) {
        log.info("Received request for streaming chat: '{}'", request.question());
        return chatService.streamChat(request);
    }
}
