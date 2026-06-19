package com.v76.gems.orchestrator;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.lang.NonNull;

import java.util.Map;

@Component
public class RetrievalClient {
    private final WebClient webClient;

    public RetrievalClient(WebClient.Builder builder, @Value("${services.retrieval.url}") @NonNull String retrievalUrl) {
        this.webClient = builder.baseUrl(retrievalUrl).build();
    }

    public RetrieveResponse retrieve(String question) {
        return webClient.post()
                .uri("/retrieve")
                .bodyValue(java.util.Objects.requireNonNull(Map.of("query", question)))
                .retrieve()
                .bodyToMono(RetrieveResponse.class)
                .block();
    }
}
