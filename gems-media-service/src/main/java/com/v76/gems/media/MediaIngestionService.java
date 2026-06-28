package com.v76.gems.media;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.v76.gems.common.chunking.Chunk;
import com.v76.gems.common.chunking.ChunkingService;
import com.v76.gems.events.ChunkCreatedEvent;
import com.v76.gems.events.Topics;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class MediaIngestionService {
    private static final Logger log = LoggerFactory.getLogger(MediaIngestionService.class);
    private final WhisperClient whisperClient;
    private final ChunkingService chunkingService;
    private final KafkaTemplate<String, ChunkCreatedEvent> kafkaTemplate;

    public MediaIngestionService(@NonNull WhisperClient whisperClient, @NonNull ChunkingService chunkingService,
            @NonNull KafkaTemplate<String, ChunkCreatedEvent> kafkaTemplate) {
        this.whisperClient = Objects.requireNonNull(whisperClient);
        this.chunkingService = Objects.requireNonNull(chunkingService);
        this.kafkaTemplate = Objects.requireNonNull(kafkaTemplate);
    }

    public MediaIngestionResult ingest(@NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);
        UUID mediaId = UUID.randomUUID();
        log.info("Starting ingestion of media file ID: {} for file: {}", mediaId, file.getOriginalFilename());
        
        log.debug("Initiating speech-to-text audio transcription for media ID: {}", mediaId);
        String transcript = whisperClient.transcribe(file);
        log.info("Successfully transcribed audio for media ID: {} (character length: {})", mediaId, transcript != null ? transcript.length() : 0);
        
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("filename", file.getOriginalFilename());
        metadata.put("contentType", file.getContentType());
        metadata.put("transcriptionProvider", "whisper-microservice");
        
        log.debug("Chunking transcript for media ID: {}", mediaId);
        List<Chunk> chunks = chunkingService.chunk(transcript, metadata);
        log.info("Media ID: {} transcript split into {} chunks", mediaId, chunks.size());
        
        for (Chunk chunk : chunks) {
            UUID chunkId = UUID.randomUUID();
            ChunkCreatedEvent event = ChunkCreatedEvent.now(mediaId, chunkId, "MEDIA", chunk.sequence(),
                    chunk.content(), chunk.metadata());
            
            log.trace("Publishing chunk event to Kafka topic {}: Media ID: {}, Chunk ID: {}, Sequence: {}", 
                Topics.MEDIA_CHUNK_CREATED, mediaId, chunkId, chunk.sequence());
                
            kafkaTemplate.send(
                    java.util.Objects.requireNonNull(Topics.MEDIA_CHUNK_CREATED),
                    java.util.Objects.requireNonNull(chunkId.toString()),
                    event);
        }
        log.info("Finished media ingestion for ID: {}, all chunks published successfully", mediaId);
        return new MediaIngestionResult(mediaId, file.getOriginalFilename(), chunks.size());
    }
}
