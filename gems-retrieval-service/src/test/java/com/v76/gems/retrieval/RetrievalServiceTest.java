package com.v76.gems.retrieval;

import com.v76.gems.common.config.RetrievalProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RetrievalServiceTest {

    @Mock RetrievalProperties properties;
    @Mock QueryEmbeddingClient embeddingClient;
    @Mock RetrievalRepository repository;

    @InjectMocks RetrievalService service;

    private static final float[] DUMMY_EMBEDDING = {0.1f, 0.2f};

    private SearchResult sampleResult(int seq) {
        return new SearchResult(UUID.randomUUID(), UUID.randomUUID(),
                "DOCUMENT", seq, "content " + seq, 0.05, Map.of());
    }

    // -----------------------------------------------------------------------
    // topK from request — uses request value, skips properties
    // -----------------------------------------------------------------------

    @Test
    void retrieve_usesRequestTopKWhenProvided() {
        RetrieveRequest request = new RetrieveRequest("what is AI?", 3);
        when(embeddingClient.embed("what is AI?")).thenReturn(DUMMY_EMBEDDING);
        when(repository.search(DUMMY_EMBEDDING, 3)).thenReturn(List.of(sampleResult(1)));

        service.retrieve(request);

        verify(repository).search(DUMMY_EMBEDDING, 3);
        // properties.topK() should NOT be called when topK is provided
        verify(properties, never()).topK();
    }

    // -----------------------------------------------------------------------
    // topK fallback to properties (topK supplied as a low sentinel value)
    // -----------------------------------------------------------------------

    @Test
    void retrieve_topKFromProperties_whenRequestTopKIsSmall() {
        // Properties override scenario: we directly test the branch where
        // topK is intentionally deferred to properties.
        // Since @NonNull topK cannot be null, we mock RetrieveRequest.
        RetrieveRequest request = mock(RetrieveRequest.class);
        when(request.query()).thenReturn("what is NLP?");
        when(request.topK()).thenReturn(null);  // simulate null topK at runtime
        when(properties.topK()).thenReturn(5);
        when(embeddingClient.embed("what is NLP?")).thenReturn(DUMMY_EMBEDDING);
        when(repository.search(DUMMY_EMBEDDING, 5)).thenReturn(List.of());

        service.retrieve(request);

        verify(repository).search(DUMMY_EMBEDDING, 5);
        verify(properties).topK();
    }

    // -----------------------------------------------------------------------
    // Response wraps results
    // -----------------------------------------------------------------------

    @Test
    void retrieve_returnsWrappedSearchResults() {
        List<SearchResult> results = List.of(sampleResult(1), sampleResult(2));
        RetrieveRequest request = new RetrieveRequest("question", 2);
        when(embeddingClient.embed("question")).thenReturn(DUMMY_EMBEDDING);
        when(repository.search(DUMMY_EMBEDDING, 2)).thenReturn(results);

        RetrieveResponse response = service.retrieve(request);

        assertThat(response.chunks()).hasSize(2);
        assertThat(response.chunks().get(0).sequence()).isEqualTo(1);
        assertThat(response.chunks().get(1).sequence()).isEqualTo(2);
    }

    @Test
    void retrieve_emptyRepositoryResult_returnsEmptyChunks() {
        RetrieveRequest request = new RetrieveRequest("unknown", 5);
        when(embeddingClient.embed("unknown")).thenReturn(DUMMY_EMBEDDING);
        when(repository.search(DUMMY_EMBEDDING, 5)).thenReturn(List.of());

        RetrieveResponse response = service.retrieve(request);

        assertThat(response.chunks()).isEmpty();
    }
}
