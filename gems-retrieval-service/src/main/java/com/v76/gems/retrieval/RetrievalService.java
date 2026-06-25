package com.v76.gems.retrieval;

import com.v76.gems.common.config.RetrievalProperties;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class RetrievalService {
    private final RetrievalProperties properties;
    private final QueryEmbeddingClient embeddingClient;
    private final RetrievalRepository repository;

    public RetrievalService(RetrievalProperties properties, QueryEmbeddingClient embeddingClient, RetrievalRepository repository) {
        this.properties = properties;
        this.embeddingClient = embeddingClient;
        this.repository = repository;
    }

    @Cacheable(value = "retrieval", key = "#request.query() + ':' + (#request.topK() != null ? #request.topK() : 5)")
    public RetrieveResponse retrieve(RetrieveRequest request) {
        int topK = request.topK() == null ? properties.topK() : request.topK();
        return new RetrieveResponse(repository.search(embeddingClient.embed(request.query()), topK));
    }
}
