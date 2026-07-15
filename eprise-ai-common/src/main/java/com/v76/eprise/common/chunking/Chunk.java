package com.v76.eprise.common.chunking;

import java.util.Map;

public record Chunk(int sequence, String content, Map<String, Object> metadata) {
}
