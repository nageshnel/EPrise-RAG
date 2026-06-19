package com.v76.gems.common.chunking;

import java.util.Map;

public record Chunk(int sequence, String content, Map<String, Object> metadata) {
}
