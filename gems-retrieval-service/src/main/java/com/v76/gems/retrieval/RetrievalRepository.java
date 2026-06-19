package com.v76.gems.retrieval;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class RetrievalRepository {
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public RetrievalRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public List<SearchResult> search(float[] queryEmbedding, int topK) {
        String vector = toVectorLiteral(queryEmbedding);
        return jdbcTemplate.query(
                """
                select id, source_id, source_type, sequence, content,
                       embedding <=> ?::vector as distance,
                       metadata::text as metadata
                from chunk_embedding
                order by embedding <=> ?::vector
                limit ?
                """,
                (rs, rowNum) -> map(rs),
                vector,
                vector,
                topK
        );
    }

    private SearchResult map(ResultSet rs) throws SQLException {
        return new SearchResult(
                UUID.fromString(rs.getString("id")),
                UUID.fromString(rs.getString("source_id")),
                rs.getString("source_type"),
                rs.getInt("sequence"),
                rs.getString("content"),
                rs.getDouble("distance"),
                metadata(rs.getString("metadata"))
        );
    }

    private Map<String, Object> metadata(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception exception) {
            return Map.of();
        }
    }

    private String toVectorLiteral(float[] embedding) {
        return Arrays.stream(toDoubleArray(embedding)).mapToObj(Double::toString).collect(Collectors.joining(",", "[", "]"));
    }

    private double[] toDoubleArray(float[] values) {
        double[] converted = new double[values.length];
        for (int index = 0; index < values.length; index++) {
            converted[index] = values[index];
        }
        return converted;
    }
}
