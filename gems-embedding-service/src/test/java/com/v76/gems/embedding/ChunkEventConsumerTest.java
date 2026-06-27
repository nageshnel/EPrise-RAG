package com.v76.gems.embedding;

import com.v76.gems.events.ChunkCreatedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class ChunkEventConsumerTest {

    @Mock EmbeddingProvider embeddingProvider;
    @Mock ChunkEmbeddingRepository repository;

    @InjectMocks ChunkEventConsumer consumer;

    private ChunkCreatedEvent eventWith(String content) {
        return new ChunkCreatedEvent(
                UUID.randomUUID(), UUID.randomUUID(),
                "DOCUMENT", 1, content,
                Map.of(), Instant.now()
        );
    }

    // -----------------------------------------------------------------------
    // Happy path
    // -----------------------------------------------------------------------

    @Test
    void consume_validEvent_embedsAndSaves() {
        ChunkCreatedEvent event = eventWith("some chunk text");
        float[] embedding = {0.1f, 0.2f};
        when(embeddingProvider.embed("some chunk text")).thenReturn(embedding);

        consumer.consume(event);

        verify(embeddingProvider).embed("some chunk text");
        verify(repository).save(event, embedding);
    }

    @Test
    void consume_embeddingStoredWithCorrectEventAndArray() {
        ChunkCreatedEvent event = eventWith("exact content");
        float[] embedding = {0.5f, 0.9f, 1.2f};
        when(embeddingProvider.embed("exact content")).thenReturn(embedding);

        ArgumentCaptor<ChunkCreatedEvent> eventCaptor = ArgumentCaptor.forClass(ChunkCreatedEvent.class);
        ArgumentCaptor<float[]> embeddingCaptor = ArgumentCaptor.forClass(float[].class);

        consumer.consume(event);

        verify(repository).save(eventCaptor.capture(), embeddingCaptor.capture());
        assertThat(eventCaptor.getValue()).isSameAs(event);
        assertThat(embeddingCaptor.getValue()).containsExactly(0.5f, 0.9f, 1.2f);
    }

    // -----------------------------------------------------------------------
    // Null event guard
    // -----------------------------------------------------------------------

    @Test
    void consume_nullEvent_noEmbeddingNoSave() {
        consumer.consume(null);

        verifyNoInteractions(embeddingProvider);
        verifyNoInteractions(repository);
    }

    // -----------------------------------------------------------------------
    // Null content guard
    // -----------------------------------------------------------------------

    @Test
    void consume_eventWithNullContent_noEmbeddingNoSave() {
        ChunkCreatedEvent event = new ChunkCreatedEvent(
                UUID.randomUUID(), UUID.randomUUID(),
                "DOCUMENT", 1, null,
                Map.of(), Instant.now()
        );

        consumer.consume(event);

        verifyNoInteractions(embeddingProvider);
        verifyNoInteractions(repository);
    }
}
