package com.v76.gems.embedding;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.v76.gems.events.ChunkCreatedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChunkEmbeddingRepositoryTest {

    @Mock JdbcTemplate jdbcTemplate;
    @Mock ObjectMapper objectMapper;

    @InjectMocks ChunkEmbeddingRepository repository;

    private ChunkCreatedEvent sampleEvent() {
        return new ChunkCreatedEvent(
                UUID.randomUUID(), UUID.randomUUID(),
                "DOCUMENT", 1,
                "chunk content", Map.of("key", "value"),
                Instant.now()
        );
    }

    // -----------------------------------------------------------------------
    // Happy path — JDBC update called once
    // -----------------------------------------------------------------------

    @Test
    void save_validEvent_executesUpsertSql() throws Exception {
        ChunkCreatedEvent event = sampleEvent();
        float[] embedding = {0.1f, 0.2f};
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"key\":\"value\"}");

        repository.save(event, embedding);

        // update(sql, Object...) — varargs captured as Object[]
        verify(jdbcTemplate).update(anyString(), any(Object[].class));
    }

    // -----------------------------------------------------------------------
    // Vector literal format at args[5]
    // -----------------------------------------------------------------------

    @Test
    void save_embeddingFormattedAsVectorLiteral() throws Exception {
        ChunkCreatedEvent event = sampleEvent();
        float[] embedding = {0.5f, 1.0f};
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");

        ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
        repository.save(event, embedding);

        verify(jdbcTemplate).update(anyString(), argsCaptor.capture());
        Object[] args = argsCaptor.getValue();

        // args[5] = vector literal
        String vectorLiteral = (String) args[5];
        assertThat(vectorLiteral).startsWith("[").endsWith("]");
        assertThat(vectorLiteral).contains("0.5").contains("1.0");
    }

    // -----------------------------------------------------------------------
    // Metadata serialization failure → fallback to "{}"
    // -----------------------------------------------------------------------

    @Test
    void save_metadataSerializationFails_usesEmptyJson() throws Exception {
        ChunkCreatedEvent event = sampleEvent();
        float[] embedding = {0.1f};
        when(objectMapper.writeValueAsString(any()))
                .thenThrow(new JsonProcessingException("fail") {});

        ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
        // Should NOT throw — ChunkEmbeddingRepository.toJson() catches the exception
        assertThatCode(() -> repository.save(event, embedding)).doesNotThrowAnyException();

        verify(jdbcTemplate).update(anyString(), argsCaptor.capture());
        String metadataJson = (String) argsCaptor.getValue()[6];
        assertThat(metadataJson).isEqualTo("{}");
    }

    // -----------------------------------------------------------------------
    // Parameter ordering: [0]=chunkId, [1]=sourceId, [2]=sourceType,
    //                     [3]=sequence, [4]=content, [5]=vector, [6]=metaJson
    // -----------------------------------------------------------------------

    @Test
    void save_correctParameterOrdering() throws Exception {
        ChunkCreatedEvent event = sampleEvent();
        float[] embedding = {0.9f};
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");

        ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
        repository.save(event, embedding);
        verify(jdbcTemplate).update(anyString(), argsCaptor.capture());

        Object[] args = argsCaptor.getValue();
        assertThat(args).hasSize(7);
        // [0] = chunkId as String
        assertThat(args[0]).isEqualTo(event.chunkId().toString());
        // [1] = sourceId as String
        assertThat(args[1]).isEqualTo(event.sourceId().toString());
        // [2] = sourceType
        assertThat(args[2]).isEqualTo("DOCUMENT");
        // [3] = sequence
        assertThat(args[3]).isEqualTo(1);
        // [4] = content
        assertThat(args[4]).isEqualTo("chunk content");
    }
}
