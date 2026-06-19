package com.v76.gems.etl.documents;

import com.v76.gems.common.chunking.Chunk;
import com.v76.gems.common.chunking.ChunkingService;
import com.v76.gems.etl.extraction.DocumentExtraction;
import com.v76.gems.etl.extraction.DocumentExtractor;
import com.v76.gems.events.ChunkCreatedEvent;
import com.v76.gems.events.Topics;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class DocumentIngestionService {
    private final DocumentExtractor extractor;
    private final ChunkingService chunkingService;
    private final KafkaTemplate<String, ChunkCreatedEvent> kafkaTemplate;

    public DocumentIngestionService(@NonNull DocumentExtractor extractor, @NonNull ChunkingService chunkingService, @NonNull KafkaTemplate<String, ChunkCreatedEvent> kafkaTemplate) {
        this.extractor = Objects.requireNonNull(extractor);
        this.chunkingService = Objects.requireNonNull(chunkingService);
        this.kafkaTemplate = Objects.requireNonNull(kafkaTemplate);
    }

    public DocumentIngestionResult ingest(@NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);
        UUID documentId = UUID.randomUUID();
        DocumentExtraction extraction = extractor.extract(file);
        List<Chunk> chunks = chunkingService.chunk(extraction.text(), extraction.metadata());
        for (Chunk chunk : chunks) {
            UUID chunkId = UUID.randomUUID();
            ChunkCreatedEvent event = ChunkCreatedEvent.now(documentId, chunkId, "DOCUMENT", chunk.sequence(), chunk.content(), chunk.metadata());
            kafkaTemplate.send(
                java.util.Objects.requireNonNull(Topics.DOCUMENT_CHUNK_CREATED),
                java.util.Objects.requireNonNull(chunkId.toString()),
                event
            );
        }
        return new DocumentIngestionResult(documentId, file.getOriginalFilename(), chunks.size());
    }
}
