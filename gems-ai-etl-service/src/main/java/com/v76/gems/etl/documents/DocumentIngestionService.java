package com.v76.gems.etl.documents;

import com.v76.gems.common.chunking.Chunk;
import com.v76.gems.common.chunking.ChunkingService;
import com.v76.gems.etl.extraction.DocumentExtraction;
import com.v76.gems.etl.extraction.DocumentExtractor;
import com.v76.gems.events.ChunkCreatedEvent;
import com.v76.gems.events.Topics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private static final Logger log = LoggerFactory.getLogger(DocumentIngestionService.class);
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
        log.info("Starting ingestion of document ID: {} for file: {}", documentId, file.getOriginalFilename());
        
        log.debug("Extracting text from document ID: {}", documentId);
        DocumentExtraction extraction = extractor.extract(file);
        
        log.debug("Chunking extracted text of document ID: {}", documentId);
        List<Chunk> chunks = chunkingService.chunk(extraction.text(), extraction.metadata());
        log.info("Document ID: {} split into {} chunks", documentId, chunks.size());
        
        for (Chunk chunk : chunks) {
            UUID chunkId = UUID.randomUUID();
            ChunkCreatedEvent event = ChunkCreatedEvent.now(documentId, chunkId, "DOCUMENT", chunk.sequence(), chunk.content(), chunk.metadata());
            
            log.trace("Publishing chunk event to Kafka topic {}: Document ID: {}, Chunk ID: {}, Sequence: {}", 
                Topics.DOCUMENT_CHUNK_CREATED, documentId, chunkId, chunk.sequence());
            
            kafkaTemplate.send(
                java.util.Objects.requireNonNull(Topics.DOCUMENT_CHUNK_CREATED),
                java.util.Objects.requireNonNull(chunkId.toString()),
                event
            );
        }
        log.info("Finished ingestion for document ID: {}, all chunks published successfully", documentId);
        return new DocumentIngestionResult(documentId, file.getOriginalFilename(), chunks.size());
    }
}
