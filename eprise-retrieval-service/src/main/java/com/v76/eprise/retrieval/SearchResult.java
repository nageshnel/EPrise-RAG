package com.v76.eprise.retrieval;

import java.util.Map;
import java.util.UUID;

public record SearchResult(UUID chunkId, UUID sourceId, String sourceType, int sequence, String content, double distance, Map<String, Object> metadata) {
}
