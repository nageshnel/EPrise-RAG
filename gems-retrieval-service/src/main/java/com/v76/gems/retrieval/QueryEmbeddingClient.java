package com.v76.gems.retrieval;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Objects;

import org.jspecify.annotations.NonNull;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Component;

@Component
public class QueryEmbeddingClient {
    private static final Logger log = LoggerFactory.getLogger(QueryEmbeddingClient.class);
    private final EmbeddingModel embeddingModel;

    public QueryEmbeddingClient(EmbeddingModel embeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    public float[] embed(@NonNull String query) {
        Objects.requireNonNull(query);
        log.info("Requesting query embedding vector for query: '{}'", query);
        try {
            float[] result = embeddingModel.embed(query);
            log.info("Successfully received query embedding vector (dimensions: {})", result != null ? result.length : 0);
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch query embedding vector from embedding service", e);
            throw e;
        }
    }
}
