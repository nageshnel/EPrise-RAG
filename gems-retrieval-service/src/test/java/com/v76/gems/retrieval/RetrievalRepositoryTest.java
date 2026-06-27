package com.v76.gems.retrieval;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SuppressWarnings({"null", "unchecked"})
@ExtendWith(MockitoExtension.class)
class RetrievalRepositoryTest {

    @Mock JdbcTemplate jdbcTemplate;

    @InjectMocks RetrievalRepository repository;

    // -----------------------------------------------------------------------
    // JDBC called — returns results
    // -----------------------------------------------------------------------

    @Test
    void search_returnsResultsFromJdbc() {
        float[] embedding = {0.1f};
        SearchResult mockResult = new SearchResult(UUID.randomUUID(), UUID.randomUUID(),
                "DOCUMENT", 1, "content", 0.1, Map.of());
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class)))
                .thenReturn(List.of(mockResult));

        List<SearchResult> results = repository.search(embedding, 1);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).content()).isEqualTo("content");
    }

    // -----------------------------------------------------------------------
    // Empty result
    // -----------------------------------------------------------------------

    @Test
    void search_emptyQueryResult_returnsEmptyList() {
        float[] embedding = {0.1f};
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class)))
                .thenReturn(List.of());

        List<SearchResult> results = repository.search(embedding, 5);

        assertThat(results).isEmpty();
    }

    // -----------------------------------------------------------------------
    // Varargs correctly captures all three positional args
    // -----------------------------------------------------------------------

    @Test
    void search_callsJdbcWithCorrectVectorAndTopK() {
        float[] embedding = {0.5f, 1.0f};
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class)))
                .thenReturn(List.of());

        repository.search(embedding, 7);

        // Capture the varargs Object[] passed to jdbcTemplate.query
        ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
        verify(jdbcTemplate).query(anyString(), any(RowMapper.class), argsCaptor.capture());

        Object[] args = argsCaptor.getValue();
        // args[0] = vector literal (for ORDER BY)
        // args[1] = vector literal (for SELECT distance)
        // args[2] = topK (LIMIT)
        assertThat(args).hasSize(3);

        String vector0 = (String) args[0];
        String vector1 = (String) args[1];
        assertThat(vector0).startsWith("[").endsWith("]");
        assertThat(vector0).contains("0.5").contains("1.0");
        assertThat(vector0).isEqualTo(vector1); // same vector used twice

        assertThat(args[2]).isEqualTo(7);
    }

    // -----------------------------------------------------------------------
    // topK passed through correctly for different values
    // -----------------------------------------------------------------------

    @Test
    void search_topKPassedToLimit() {
        float[] embedding = {0.1f};
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(Object[].class)))
                .thenReturn(List.of());

        repository.search(embedding, 10);

        ArgumentCaptor<Object[]> argsCaptor = ArgumentCaptor.forClass(Object[].class);
        verify(jdbcTemplate).query(anyString(), any(RowMapper.class), argsCaptor.capture());
        assertThat(argsCaptor.getValue()[2]).isEqualTo(10);
    }
}
