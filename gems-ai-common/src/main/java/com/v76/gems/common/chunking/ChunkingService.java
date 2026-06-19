package com.v76.gems.common.chunking;

import java.util.List;
import java.util.Map;

public interface ChunkingService {
    List<Chunk> chunk(String content, Map<String, Object> metadata);
}
