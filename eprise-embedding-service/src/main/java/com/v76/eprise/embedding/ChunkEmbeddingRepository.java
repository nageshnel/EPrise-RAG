package com.v76.eprise.embedding;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.v76.eprise.events.ChunkCreatedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.lang.NonNull;

import java.util.Arrays;
import java.util.stream.Collectors;

@Repository
public class ChunkEmbeddingRepository {
    private static final Logger log = LoggerFactory.getLogger(ChunkEmbeddingRepository.class);
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public ChunkEmbeddingRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void save(@NonNull ChunkCreatedEvent event, @NonNull float[] embedding) {
        if ("DOCUMENT".equalsIgnoreCase(event.sourceType())) {
            saveDocumentMetadata(event);
        }

        jdbcTemplate.update(
                """
                        insert into chunk_embedding (id, source_id, source_type, sequence, content, embedding, metadata)
                        values (?::uuid, ?::uuid, ?, ?, ?, ?::vector, ?::jsonb)
                        on conflict (id) do update set
                            content = excluded.content,
                            embedding = excluded.embedding,
                            metadata = excluded.metadata
                        """,
                event.chunkId().toString(),
                event.sourceId().toString(),
                event.sourceType(),
                event.sequence(),
                event.content(),
                toVectorLiteral(embedding),
                toJson(event));
    }

    private void saveDocumentMetadata(ChunkCreatedEvent event) {
        if (event.metadata() == null) {
            return;
        }
        
        String filename = null;
        Object fileObj = event.metadata().get("filename");
        if (fileObj != null) {
            filename = fileObj.toString();
        }
        if (filename == null) {
            filename = "unknown_" + event.sourceId().toString();
        }
        
        String contentType = null;
        Object mimeObj = event.metadata().get("contentType");
        if (mimeObj != null) {
            contentType = mimeObj.toString();
        }
        
        Long sizeBytes = null;
        Object sizeObj = event.metadata().get("size");
        if (sizeObj instanceof Number num) {
            sizeBytes = num.longValue();
        } else if (sizeObj instanceof String str) {
            try {
                sizeBytes = Long.parseLong(str);
            } catch (NumberFormatException ignored) {}
        }

        jdbcTemplate.update(
                """
                insert into document_metadata (id, filename, content_type, size_bytes)
                values (?::uuid, ?, ?, ?)
                on conflict (id) do nothing
                """,
                event.sourceId().toString(),
                filename,
                contentType,
                sizeBytes
        );
    }

    private String toJson(ChunkCreatedEvent event) {
        try {
            return objectMapper.writeValueAsString(event.metadata());
        } catch (Exception exception) {
            return "{}";
        }
    }

    private String toVectorLiteral(float[] embedding) {
        return Arrays.stream(toDoubleArray(embedding)).mapToObj(Double::toString)
                .collect(Collectors.joining(",", "[", "]"));
    }

    private double[] toDoubleArray(float[] values) {
        double[] converted = new double[values.length];
        for (int index = 0; index < values.length; index++) {
            converted[index] = values[index];
        }
        return converted;
    }
}
