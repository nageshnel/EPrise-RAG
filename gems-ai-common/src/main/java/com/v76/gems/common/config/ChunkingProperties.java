package com.v76.gems.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.Objects;

@ConfigurationProperties(prefix = "ai.chunking")
public record ChunkingProperties(String strategy, int maxSegmentSize, int maxOverlapSize) {
    public ChunkingProperties {
        if (strategy == null || strategy.isBlank())
            strategy = "paragraph";
        if (maxSegmentSize <= 0)
            maxSegmentSize = 1000;
        if (maxOverlapSize < 0)
            maxOverlapSize = 200;
    }
}
