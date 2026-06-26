package com.v76.gems.embedding;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.embedding.EmbeddingModel;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SpringAiEmbeddingProviderTest {

    @Mock EmbeddingModel embeddingModel;

    @InjectMocks SpringAiEmbeddingProvider provider;

    // -----------------------------------------------------------------------
    // Happy path
    // -----------------------------------------------------------------------

    @Test
    void embed_validContent_returnsFloatArray() {
        float[] expected = {0.1f, 0.2f, 0.3f};
        when(embeddingModel.embed("hello world")).thenReturn(expected);

        float[] result = provider.embed("hello world");

        assertThat(result).containsExactly(0.1f, 0.2f, 0.3f);
    }

    @Test
    void embed_delegatesExactlyOnce() {
        when(embeddingModel.embed(any(String.class))).thenReturn(new float[]{0.0f});

        provider.embed("some content");

        verify(embeddingModel, times(1)).embed("some content");
    }

    // -----------------------------------------------------------------------
    // Null / blank content
    // -----------------------------------------------------------------------

    @Test
    void embed_nullContent_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> provider.embed(null))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(embeddingModel);
    }

    @Test
    void embed_blankContent_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> provider.embed("   "))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(embeddingModel);
    }

    @Test
    void embed_emptyString_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> provider.embed(""))
                .isInstanceOf(IllegalArgumentException.class);
        verifyNoInteractions(embeddingModel);
    }
}
