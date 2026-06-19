package com.v76.gems.embedding;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.v76.gems.events.ChunkCreatedEvent;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.lang.NonNull;

import java.util.Arrays;
import java.util.stream.Collectors;

@Repository
public class ChunkEmbeddingRepository {
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public ChunkEmbeddingRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public void save(@NonNull ChunkCreatedEvent event, @NonNull float[] embedding) {
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
