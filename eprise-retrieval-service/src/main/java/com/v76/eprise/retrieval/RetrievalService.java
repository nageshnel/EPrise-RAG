package com.v76.eprise.retrieval;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.v76.eprise.common.config.RetrievalProperties;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class RetrievalService {
    private static final Logger log = LoggerFactory.getLogger(RetrievalService.class);
    private final RetrievalProperties properties;
    private final QueryEmbeddingClient embeddingClient;
    private final RetrievalRepository repository;

    public RetrievalService(RetrievalProperties properties, QueryEmbeddingClient embeddingClient,
            RetrievalRepository repository) {
        this.properties = properties;
        this.embeddingClient = embeddingClient;
        this.repository = repository;
    }

    @Cacheable(value = "retrieval", key = "#a0.query() + ':' + (#a0.topK() != null ? #a0.topK() : 5)")
    public RetrieveResponse retrieve(RetrieveRequest request) {
        int topK = request.topK() == null ? properties.topK() : request.topK();
        log.info("Cache miss - retrieving embeddings and database matches for query: '{}' with topK: {}",
                request.query(), topK);
        float[] embedding = embeddingClient.embed(request.query());
        java.util.List<SearchResult> results = repository.search(embedding, topK);
        log.debug("Database vector similarity search returned {} matches for query: '{}'",
                results != null ? results.size() : 0, request.query());
        return new RetrieveResponse(results);
    }
}
