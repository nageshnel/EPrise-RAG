package com.v76.gems.embedding;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Component;
import org.springframework.lang.NonNull;

@Component
public class SpringAiEmbeddingProvider implements EmbeddingProvider {
    private final EmbeddingModel embeddingModel;

    public SpringAiEmbeddingProvider(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    @Override
    public @NonNull float[] embed(@NonNull String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Content must not be null or blank");
        }
        return embeddingModel.embed(content);
    }
}
