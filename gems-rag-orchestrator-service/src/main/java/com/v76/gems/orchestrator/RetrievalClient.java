package com.v76.gems.orchestrator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.lang.NonNull;

import java.util.Map;

@Component
public class RetrievalClient {
    private static final Logger log = LoggerFactory.getLogger(RetrievalClient.class);
    private final WebClient webClient;

    public RetrievalClient(WebClient.Builder builder, @Value("${services.retrieval.url}") @NonNull String retrievalUrl) {
        this.webClient = builder.baseUrl(retrievalUrl).build();
        log.info("Initialized RetrievalClient with URL: {}", retrievalUrl);
    }

    public RetrieveResponse retrieve(String question) {
        log.debug("Sending POST request to retrieval service /retrieve for: '{}'", question);
        try {
            RetrieveResponse response = webClient.post()
                    .uri("/retrieve")
                    .bodyValue(java.util.Objects.requireNonNull(Map.of("query", question)))
                    .retrieve()
                    .bodyToMono(RetrieveResponse.class)
                    .block();
            log.info("Received retrieval response with {} context chunks", response != null && response.chunks() != null ? response.chunks().size() : 0);
            return response;
        } catch (Exception e) {
            log.error("Failed to query retrieval service at {}", webClient, e);
            throw e;
        }
    }
}
