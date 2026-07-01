package com.v76.gems.orchestrator;

import java.time.Instant;
import java.util.UUID;

public record ChatMessage(
    UUID id,
    UUID sessionId,
    String sender,
    String content,
    String citations,
    Instant createdAt
) {}
