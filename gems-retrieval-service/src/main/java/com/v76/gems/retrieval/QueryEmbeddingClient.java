package com.v76.gems.retrieval;

import java.util.Objects;

import org.jspecify.annotations.NonNull;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Component;

@Component
public class QueryEmbeddingClient {
    private final EmbeddingModel embeddingModel;

    public QueryEmbeddingClient(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    public float[] embed(@NonNull String query) {
        Objects.requireNonNull(query);
        return embeddingModel.embed(query);
    }
}
