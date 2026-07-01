package com.v76.gems.orchestrator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
    public ChatResponse chat(
            @RequestHeader("X-User-Id") String userIdHeader,
            @RequestBody @NonNull ChatRequest request) {
        log.info("Received request for blocking chat: '{}' for user: {}", request.question(), userIdHeader);
        ChatResponse response = chatService.chat(java.util.UUID.fromString(userIdHeader), request);
        log.info("Blocking chat response generated (citations: {})", response.sources() != null ? response.sources().size() : 0);
        return response;
    }

    @PostMapping(value = "/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public reactor.core.publisher.Flux<org.springframework.http.codec.ServerSentEvent<String>> streamChat(
            @RequestHeader("X-User-Id") String userIdHeader,
            @RequestBody @NonNull ChatRequest request) {
        log.info("Received request for streaming chat: '{}' for user: {}", request.question(), userIdHeader);
        return chatService.streamChat(java.util.UUID.fromString(userIdHeader), request);
    }
}
