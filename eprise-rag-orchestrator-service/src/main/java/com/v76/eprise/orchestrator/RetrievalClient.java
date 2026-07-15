package com.v76.eprise.orchestrator;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.v76.eprise.retrieval.grpc.RetrievalGrpcServiceGrpc;
import com.v76.eprise.retrieval.grpc.RetrievalRequest;
import com.v76.eprise.retrieval.grpc.RetrievalResponse;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class RetrievalClient {
    private static final Logger log = LoggerFactory.getLogger(RetrievalClient.class);
    private final ObjectMapper objectMapper;

    @GrpcClient("retrieval-service")
    private RetrievalGrpcServiceGrpc.RetrievalGrpcServiceBlockingStub retrievalStub;

    public RetrievalClient(ObjectMapper objectMapper) {
        this.objectMapper = Objects.requireNonNull(objectMapper);
    }

    public RetrieveResponse retrieve(String question) {
        log.debug("Sending gRPC request to retrieval service for: '{}'", question);
        try {
            RetrievalRequest request = RetrievalRequest.newBuilder()
                    .setQuery(question)
                    .setTopK(0)
                    .build();

            RetrievalResponse response = retrievalStub.retrieve(request);

            List<RetrievedChunk> chunks = response.getChunksList().stream()
                    .map(chunk -> new RetrievedChunk(
                            UUID.fromString(chunk.getChunkId()),
                            UUID.fromString(chunk.getSourceId()),
                            chunk.getSourceType(),
                            chunk.getSequence(),
                            chunk.getContent(),
                            chunk.getDistance(),
                            parseMetadata(chunk.getMetadataJson())
                    ))
                    .collect(Collectors.toList());

            log.info("Received gRPC retrieval response with {} context chunks", chunks.size());
            return new RetrieveResponse(chunks);
        } catch (Exception e) {
            log.error("Failed to query retrieval service via gRPC", e);
            throw new RuntimeException("gRPC retrieval request failed: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> parseMetadata(String json) {
        if (json == null || json.isBlank() || json.equals("{}")) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }
}
