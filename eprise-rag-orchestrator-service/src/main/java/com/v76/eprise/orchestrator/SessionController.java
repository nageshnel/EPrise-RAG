package com.v76.eprise.orchestrator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/chat/sessions")
public class SessionController {
    private static final Logger log = LoggerFactory.getLogger(SessionController.class);

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;

    public SessionController(ChatSessionRepository sessionRepository, ChatMessageRepository messageRepository) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
    }

    @GetMapping
    public List<ChatSession> getSessions(@RequestHeader("X-User-Id") String userIdHeader) {
        log.info("Fetching sessions for user: {}", userIdHeader);
        UUID userId = UUID.fromString(userIdHeader);
        return sessionRepository.findAllByUserId(userId);
    }

    @PostMapping
    public ChatSession createSession(
            @RequestHeader("X-User-Id") String userIdHeader,
            @RequestBody(required = false) CreateSessionRequest request) {
        UUID userId = UUID.fromString(userIdHeader);
        String title = (request != null && request.title() != null && !request.title().isBlank())
                ? request.title()
                : "New Chat";
        log.info("Creating session for user {} with title: {}", userIdHeader, title);
        ChatSession session = new ChatSession(null, userId, title, Instant.now(), Instant.now());
        return sessionRepository.save(session);
    }

    @GetMapping("/{sessionId}/messages")
    public List<ChatMessage> getMessages(
            @RequestHeader("X-User-Id") String userIdHeader,
            @PathVariable UUID sessionId) {
        log.info("Fetching messages for session: {} by user: {}", sessionId, userIdHeader);

        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        if (!session.userId().equals(UUID.fromString(userIdHeader))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        return messageRepository.findAllBySessionId(sessionId);
    }

    @DeleteMapping("/{sessionId}")
    public void deleteSession(
            @RequestHeader("X-User-Id") String userIdHeader,
            @PathVariable UUID sessionId) {
        log.info("Deleting session: {} by user: {}", sessionId, userIdHeader);

        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        if (!session.userId().equals(UUID.fromString(userIdHeader))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        sessionRepository.deleteById(sessionId);
    }

    public record CreateSessionRequest(String title) {}
}
