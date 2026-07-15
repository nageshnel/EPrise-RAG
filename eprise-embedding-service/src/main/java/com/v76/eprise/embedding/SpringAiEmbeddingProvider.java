package com.v76.eprise.embedding;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Component;
import org.springframework.lang.NonNull;

@Component
public class SpringAiEmbeddingProvider implements EmbeddingProvider {
    private static final Logger log = LoggerFactory.getLogger(SpringAiEmbeddingProvider.class);
    private final EmbeddingModel embeddingModel;

    public SpringAiEmbeddingProvider(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    @Override
    public @NonNull float[] embed(@NonNull String content) {
        if (content == null || content.isBlank()) {
            log.error("Failed to generate embedding: content is null or blank");
            throw new IllegalArgumentException("Content must not be null or blank");
        }
        log.info("Generating embedding for content (length: {} characters)", content.length());
        try {
            float[] vector = embeddingModel.embed(content);
            log.info("Successfully generated embedding vector with dimensions: {}", vector != null ? vector.length : 0);
            return vector;
        } catch (Exception e) {
            log.error("Error occurred while generating embedding using Spring AI model", e);
            throw e;
        }
    }
}
