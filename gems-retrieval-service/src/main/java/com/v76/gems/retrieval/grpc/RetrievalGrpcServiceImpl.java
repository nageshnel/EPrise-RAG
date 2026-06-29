package com.v76.gems.retrieval.grpc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.v76.gems.retrieval.RetrievalService;
import com.v76.gems.retrieval.RetrieveRequest;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@GrpcService
public class RetrievalGrpcServiceImpl extends RetrievalGrpcServiceGrpc.RetrievalGrpcServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(RetrievalGrpcServiceImpl.class);
    private final RetrievalService retrievalService;
    private final ObjectMapper objectMapper;

    public RetrievalGrpcServiceImpl(RetrievalService retrievalService, ObjectMapper objectMapper) {
        this.retrievalService = Objects.requireNonNull(retrievalService);
        this.objectMapper = Objects.requireNonNull(objectMapper);
    }

    @Override
    public void retrieve(RetrievalRequest request, StreamObserver<RetrievalResponse> responseObserver) {
        log.info("Received gRPC retrieval request for query: '{}' with topK: {}", request.getQuery(), request.getTopK());
        try {
            Integer topK = request.getTopK() > 0 ? request.getTopK() : null;
            RetrieveRequest localRequest = new RetrieveRequest(request.getQuery(), topK);

            com.v76.gems.retrieval.RetrieveResponse localResponse = retrievalService.retrieve(localRequest);

            List<SearchResult> grpcResults = localResponse.chunks().stream()
                    .map(chunk -> SearchResult.newBuilder()
                            .setChunkId(chunk.chunkId().toString())
                            .setSourceId(chunk.sourceId().toString())
                            .setSourceType(chunk.sourceType() != null ? chunk.sourceType() : "")
                            .setSequence(chunk.sequence())
                            .setContent(chunk.content() != null ? chunk.content() : "")
                            .setDistance(chunk.distance())
                            .setMetadataJson(toJson(chunk.metadata()))
                            .build())
                    .collect(Collectors.toList());

            RetrievalResponse response = RetrievalResponse.newBuilder()
                    .addAllChunks(grpcResults)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
            log.info("Successfully completed gRPC retrieval request (found {} matching chunks)", grpcResults.size());
        } catch (Exception e) {
            log.error("Failed to execute gRPC retrieval", e);
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Retrieval error: " + e.getMessage())
                    .asRuntimeException());
        }
    }

    private String toJson(java.util.Map<String, Object> map) {
        if (map == null) return "{}";
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }
}
