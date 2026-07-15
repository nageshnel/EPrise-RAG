package com.v76.eprise.retrieval;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RetrievalControllerTest {

    @Mock RetrievalService retrievalService;

    @InjectMocks RetrievalController controller;

    @Test
    void retrieve_validRequest_returnsResponse() {
        RetrieveRequest request = new RetrieveRequest("what is embedding?", 3);
        SearchResult result = new SearchResult(UUID.randomUUID(), UUID.randomUUID(),
                "DOCUMENT", 1, "Embedding is a vector representation.", 0.1, Map.of());
        RetrieveResponse expected = new RetrieveResponse(List.of(result));

        when(retrievalService.retrieve(request)).thenReturn(expected);

        RetrieveResponse actual = controller.retrieve(request);

        assertThat(actual).isEqualTo(expected);
        verify(retrievalService).retrieve(request);
    }

    @Test
    void retrieve_emptyChunks_returnsEmptyResponse() {
        RetrieveRequest request = new RetrieveRequest("obscure question", 5);
        RetrieveResponse empty = new RetrieveResponse(List.of());

        when(retrievalService.retrieve(request)).thenReturn(empty);

        RetrieveResponse actual = controller.retrieve(request);

        assertThat(actual.chunks()).isEmpty();
    }

    @Test
    void retrieve_delegatesExactlyOnce() {
        RetrieveRequest request = new RetrieveRequest("test", 1);
        when(retrievalService.retrieve(request)).thenReturn(new RetrieveResponse(List.of()));

        controller.retrieve(request);

        verify(retrievalService, times(1)).retrieve(request);
    }
}
