package com.v76.gems.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai.embedding-api")
public record EmbeddingApiProperties(String baseUrl, String apiKey, String model, int dimensions) {
    public EmbeddingApiProperties {
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "https://api.example.com";
        if (model == null || model.isBlank()) model = "embedding-model";
        if (dimensions <= 0) dimensions = 768;
    }
}
