package com.v76.gems.retrieval;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.embedding.EmbeddingModel;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QueryEmbeddingClientTest {

    @Mock EmbeddingModel embeddingModel;

    @InjectMocks QueryEmbeddingClient client;

    @Test
    void embed_validQuery_returnsFloatArray() {
        float[] expected = {0.1f, 0.5f, 0.9f};
        when(embeddingModel.embed("what is RAG?")).thenReturn(expected);

        float[] result = client.embed("what is RAG?");

        assertThat(result).containsExactly(0.1f, 0.5f, 0.9f);
        verify(embeddingModel).embed("what is RAG?");
    }

    @Test
    void embed_nullQuery_throwsNullPointerException() {
        assertThatThrownBy(() -> client.embed(null))
                .isInstanceOf(NullPointerException.class);
        verifyNoInteractions(embeddingModel);
    }

    @Test
    void embed_delegatesExactlyOnce() {
        when(embeddingModel.embed(anyString())).thenReturn(new float[]{0.0f});

        client.embed("query text");

        verify(embeddingModel, times(1)).embed("query text");
    }
}
