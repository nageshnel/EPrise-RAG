package com.v76.eprise.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai.text-api")
public record TextGenerationApiProperties(String baseUrl, String apiKey, String model) {
    public TextGenerationApiProperties {
        if (baseUrl == null || baseUrl.isBlank()) baseUrl = "https://api.example.com";
        if (model == null || model.isBlank()) model = "chat-model";
    }
}
