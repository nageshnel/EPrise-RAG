package com.v76.eprise.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai.retrieval")
public record RetrievalProperties(int topK) {
    public RetrievalProperties {
        if (topK <= 0) topK = 5;
    }
}
