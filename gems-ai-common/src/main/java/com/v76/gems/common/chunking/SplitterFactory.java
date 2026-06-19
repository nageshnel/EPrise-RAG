package com.v76.gems.common.chunking;

import com.v76.gems.common.config.ChunkingProperties;
import dev.langchain4j.data.document.splitter.DocumentByLineSplitter;
import dev.langchain4j.data.document.splitter.DocumentByParagraphSplitter;
import dev.langchain4j.data.document.splitter.DocumentBySentenceSplitter;
import dev.langchain4j.data.document.splitter.DocumentByWordSplitter;
import dev.langchain4j.data.document.DocumentSplitter;

import java.util.Locale;

public class SplitterFactory {
    public DocumentSplitter create(ChunkingProperties properties) {
        String strategy = properties.strategy().toLowerCase(Locale.ROOT);
        return switch (strategy) {
            case "sentence" -> new DocumentBySentenceSplitter(properties.maxSegmentSize(), properties.maxOverlapSize());
            case "line" -> new DocumentByLineSplitter(properties.maxSegmentSize(), properties.maxOverlapSize());
            case "word" -> new DocumentByWordSplitter(properties.maxSegmentSize(), properties.maxOverlapSize());
            case "paragraph", "recursive" -> new DocumentByParagraphSplitter(properties.maxSegmentSize(), properties.maxOverlapSize());
            default -> throw new IllegalArgumentException("Unsupported chunking strategy: " + strategy);
        };
    }
}
