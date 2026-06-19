package com.v76.gems.media;

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
        String transcript = whisperClient.transcribe(file);
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("filename", file.getOriginalFilename());
        metadata.put("contentType", file.getContentType());
        metadata.put("transcriptionProvider", "whisper-microservice");
        List<Chunk> chunks = chunkingService.chunk(transcript, metadata);
        for (Chunk chunk : chunks) {
            UUID chunkId = UUID.randomUUID();
            ChunkCreatedEvent event = ChunkCreatedEvent.now(mediaId, chunkId, "MEDIA", chunk.sequence(),
                    chunk.content(), chunk.metadata());
            kafkaTemplate.send(
                    java.util.Objects.requireNonNull(Topics.MEDIA_CHUNK_CREATED),
                    java.util.Objects.requireNonNull(chunkId.toString()),
                    event);
        }
        return new MediaIngestionResult(mediaId, file.getOriginalFilename(), chunks.size());
    }
}
