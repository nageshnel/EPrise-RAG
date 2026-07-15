package com.v76.eprise.orchestrator;

import java.util.Map;
import java.util.UUID;

public record SourceCitation(UUID chunkId, UUID sourceId, String sourceType, int sequence, Map<String, Object> metadata) {
}
