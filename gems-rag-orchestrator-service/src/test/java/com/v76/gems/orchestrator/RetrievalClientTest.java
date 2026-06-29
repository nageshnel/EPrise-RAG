package com.v76.gems.orchestrator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.v76.gems.retrieval.grpc.RetrievalGrpcServiceGrpc;
import com.v76.gems.retrieval.grpc.RetrievalRequest;
import com.v76.gems.retrieval.grpc.RetrievalResponse;
import com.v76.gems.retrieval.grpc.SearchResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RetrievalClientTest {

    @Mock
    private RetrievalGrpcServiceGrpc.RetrievalGrpcServiceBlockingStub retrievalStub;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private RetrievalClient retrievalClient;

    @Test
    void retrieve_callsGrpcService_returnsMappedChunks() {
        ReflectionTestUtils.setField(retrievalClient, "retrievalStub", retrievalStub);

        UUID chunkId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();

        SearchResult grpcResult = SearchResult.newBuilder()
                .setChunkId(chunkId.toString())
                .setSourceId(sourceId.toString())
                .setSourceType("DOCUMENT")
                .setSequence(1)
                .setContent("test content")
                .setDistance(0.12)
                .setMetadataJson("{\"key\":\"value\"}")
                .build();

        RetrievalResponse grpcResponse = RetrievalResponse.newBuilder()
                .addAllChunks(List.of(grpcResult))
                .build();

        when(retrievalStub.retrieve(any(RetrievalRequest.class))).thenReturn(grpcResponse);

        RetrieveResponse result = retrievalClient.retrieve("test query");

        assertThat(result).isNotNull();
        assertThat(result.chunks()).hasSize(1);
        RetrievedChunk chunk = result.chunks().get(0);
        assertThat(chunk.chunkId()).isEqualTo(chunkId);
        assertThat(chunk.content()).isEqualTo("test content");
        assertThat(chunk.metadata()).containsEntry("key", "value");
    }
}
