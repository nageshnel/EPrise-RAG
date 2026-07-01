package com.v76.gems.orchestrator;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public class ChatMessageRepository {
    private final JdbcTemplate jdbcTemplate;

    public ChatMessageRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ChatMessage> findAllBySessionId(UUID sessionId) {
        return jdbcTemplate.query(
                "SELECT id, session_id, sender, content, citations, created_at FROM chat_message WHERE session_id = ? ORDER BY created_at ASC",
                this::mapRow,
                sessionId
        );
    }

    public List<ChatMessage> findRecentBySessionId(UUID sessionId, int limit) {
        return jdbcTemplate.query(
                "SELECT id, session_id, sender, content, citations, created_at FROM chat_message WHERE session_id = ? ORDER BY created_at DESC LIMIT ?",
                this::mapRow,
                sessionId,
                limit
        );
    }

    public void save(ChatMessage message) {
        UUID id = message.id() != null ? message.id() : UUID.randomUUID();
        Instant createdAt = message.createdAt() != null ? message.createdAt() : Instant.now();
        jdbcTemplate.update(
                "INSERT INTO chat_message (id, session_id, sender, content, citations, created_at) VALUES (?, ?, ?, ?, ?::jsonb, ?)",
                id,
                message.sessionId(),
                message.sender(),
                message.content(),
                message.citations() != null ? message.citations() : "[]",
                createdAt
        );
    }

    private ChatMessage mapRow(ResultSet rs, int rowNum) throws SQLException {
        String citationsVal = rs.getString("citations");
        return new ChatMessage(
                UUID.fromString(rs.getString("id")),
                UUID.fromString(rs.getString("session_id")),
                rs.getString("sender"),
                rs.getString("content"),
                citationsVal != null ? citationsVal : "[]",
                rs.getTimestamp("created_at").toInstant()
        );
    }
}
