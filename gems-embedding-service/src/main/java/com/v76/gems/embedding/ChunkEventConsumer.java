package com.v76.gems.embedding;

import com.v76.gems.events.ChunkCreatedEvent;
import com.v76.gems.events.Topics;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class ChunkEventConsumer {
    private static final Logger log = LoggerFactory.getLogger(ChunkEventConsumer.class);

    private final EmbeddingProvider embeddingProvider;
    private final ChunkEmbeddingRepository repository;

    public ChunkEventConsumer(EmbeddingProvider embeddingProvider, ChunkEmbeddingRepository repository) {
        this.embeddingProvider = embeddingProvider;
        this.repository = repository;
    }

    @KafkaListener(topics = { Topics.DOCUMENT_CHUNK_CREATED,
            Topics.MEDIA_CHUNK_CREATED }, groupId = "gems-embedding-service")
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
        repository.save(event, embeddingProvider.embed(content));
    }
}
