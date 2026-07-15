package com.v76.eprise.orchestrator;

import java.time.Instant;
import java.util.UUID;

public record ChatSession(
    UUID id,
    UUID userId,
    String title,
    Instant createdAt,
    Instant updatedAt
) {}
