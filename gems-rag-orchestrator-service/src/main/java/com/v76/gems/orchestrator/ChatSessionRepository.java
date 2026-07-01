package com.v76.gems.orchestrator;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ChatSessionRepository {
    private final JdbcTemplate jdbcTemplate;

    public ChatSessionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ChatSession> findAllByUserId(UUID userId) {
        return jdbcTemplate.query(
                "SELECT id, user_id, title, created_at, updated_at FROM chat_session WHERE user_id = ? ORDER BY updated_at DESC",
                this::mapRow,
                userId
        );
    }

    public Optional<ChatSession> findById(UUID id) {
        List<ChatSession> sessions = jdbcTemplate.query(
                "SELECT id, user_id, title, created_at, updated_at FROM chat_session WHERE id = ?",
                this::mapRow,
                id
        );
        return sessions.stream().findFirst();
    }

    public ChatSession save(ChatSession session) {
        UUID id = session.id() != null ? session.id() : UUID.randomUUID();
        Instant now = Instant.now();
        Instant createdAt = session.createdAt() != null ? session.createdAt() : now;
        Instant updatedAt = now;
        jdbcTemplate.update(
                "INSERT INTO chat_session (id, user_id, title, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?) " +
                "ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = EXCLUDED.updated_at",
                id,
                session.userId(),
                session.title(),
                createdAt,
                updatedAt
        );
        return new ChatSession(id, session.userId(), session.title(), createdAt, updatedAt);
    }

    public void deleteById(UUID id) {
        jdbcTemplate.update("DELETE FROM chat_session WHERE id = ?", id);
    }

    private ChatSession mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new ChatSession(
                UUID.fromString(rs.getString("id")),
                UUID.fromString(rs.getString("user_id")),
                rs.getString("title"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("updated_at").toInstant()
        );
    }
}
