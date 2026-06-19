package com.v76.gems.common.chunking;

import com.v76.gems.common.config.ChunkingProperties;
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.segment.TextSegment;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class LangChain4jChunkingService implements ChunkingService {
    private final ChunkingProperties properties;
    private final SplitterFactory splitterFactory;

    public LangChain4jChunkingService(ChunkingProperties properties, SplitterFactory splitterFactory) {
        this.properties = properties;
        this.splitterFactory = splitterFactory;
    }

    @Override
    public List<Chunk> chunk(String content, Map<String, Object> metadata) {
        if (content == null || content.isBlank()) return List.of();
        DocumentSplitter splitter = splitterFactory.create(properties);
        List<TextSegment> segments = splitter.split(Document.from(content));
        List<Chunk> chunks = new ArrayList<>(segments.size());
        for (int index = 0; index < segments.size(); index++) {
            Map<String, Object> chunkMetadata = new LinkedHashMap<>(metadata == null ? Map.of() : metadata);
            chunkMetadata.put("chunkingStrategy", properties.strategy());
            chunks.add(new Chunk(index + 1, segments.get(index).text(), chunkMetadata));
        }
        return chunks;
    }
}
