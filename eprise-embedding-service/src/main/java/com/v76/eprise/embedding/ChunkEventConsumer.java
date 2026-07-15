package com.v76.eprise.embedding;

import com.v76.eprise.events.ChunkCreatedEvent;
import com.v76.eprise.events.Topics;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.apache.skywalking.apm.toolkit.trace.ActiveSpan;
import org.apache.skywalking.apm.toolkit.trace.Trace;

@Service
public class ChunkEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(ChunkEventConsumer.class);

    private final EmbeddingProvider embeddingProvider;
    private final ChunkEmbeddingRepository repository;

    public ChunkEventConsumer(EmbeddingProvider embeddingProvider, ChunkEmbeddingRepository repository) {
        this.embeddingProvider = embeddingProvider;
        this.repository = repository;
    }

    @Trace
    @KafkaListener(topics = { Topics.DOCUMENT_CHUNK_CREATED,
            Topics.MEDIA_CHUNK_CREATED }, groupId = "eprise-embedding-service")
    public void consume(ChunkCreatedEvent event) {
        if (event == null) {
            log.error("Received null ChunkCreatedEvent from Kafka, skipping processing.");
            return;
        }
        String content = event.content();
        if (content == null) {
            log.warn("Received ChunkCreatedEvent with null content for chunkId: {}, skipping processing.",
                    event.chunkId());
            return;
        }

        long start = System.currentTimeMillis();
        float[] embedding = embeddingProvider.embed(content);
        long duration = System.currentTimeMillis() - start;

        ActiveSpan.tag("embedding.time_ms", String.valueOf(duration));
        ActiveSpan.tag("chunks.processed", "1");

        repository.save(event, embedding);
    }
}
