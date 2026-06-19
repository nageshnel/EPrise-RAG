package com.v76.gems.orchestrator;

import java.util.Map;
import java.util.UUID;

public record RetrievedChunk(UUID chunkId, UUID sourceId, String sourceType, int sequence, String content, double distance, Map<String, Object> metadata) {
}
