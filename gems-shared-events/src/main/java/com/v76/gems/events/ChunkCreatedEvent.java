package com.v76.gems.events;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

public record ChunkCreatedEvent(UUID sourceId, UUID chunkId, String sourceType, int sequence, String content,
        Map<String, Object> metadata, Instant createdAt) {
    public static ChunkCreatedEvent now(UUID sourceId, UUID chunkId, String sourceType, int sequence, String content,
            Map<String, Object> metadata) {
        Objects.requireNonNull(sourceId);
        Objects.requireNonNull(chunkId);
        Objects.requireNonNull(sourceType);
        Objects.requireNonNull(content);
        Objects.requireNonNull(metadata);
        return new ChunkCreatedEvent(sourceId, chunkId, sourceType, sequence, content, metadata, Instant.now());
    }
}
