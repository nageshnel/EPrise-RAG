package com.v76.gems.etl.documents;

import com.v76.gems.common.chunking.Chunk;
import com.v76.gems.common.chunking.ChunkingService;
import com.v76.gems.etl.extraction.DocumentExtraction;
import com.v76.gems.etl.extraction.DocumentExtractor;
import com.v76.gems.events.ChunkCreatedEvent;
import com.v76.gems.events.Topics;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentIngestionServiceTest {

    @Mock DocumentExtractor extractor;
    @Mock ChunkingService chunkingService;
    @Mock KafkaTemplate<String, ChunkCreatedEvent> kafkaTemplate;

    @InjectMocks DocumentIngestionService service;

    private MockMultipartFile sampleFile() {
        return new MockMultipartFile("file", "report.pdf", "application/pdf", "pdf content".getBytes());
    }

    // -----------------------------------------------------------------------
    // Happy path — Kafka messages published
    // -----------------------------------------------------------------------

    @Test
    void ingest_validFile_publishesChunkEventsToKafka() throws IOException {
        MockMultipartFile file = sampleFile();
        DocumentExtraction extraction = new DocumentExtraction("Extracted text", Map.of("contentType", "application/pdf"));
        List<Chunk> chunks = List.of(
                new Chunk(1, "chunk 1", Map.of()),
                new Chunk(2, "chunk 2", Map.of()),
                new Chunk(3, "chunk 3", Map.of())
        );

        when(extractor.extract(file)).thenReturn(extraction);
        when(chunkingService.chunk(eq("Extracted text"), any())).thenReturn(chunks);

        service.ingest(file);

        verify(kafkaTemplate, times(3)).send(eq(Topics.DOCUMENT_CHUNK_CREATED), anyString(), any(ChunkCreatedEvent.class));
    }

    @Test
    void ingest_returnsCorrectResult() throws IOException {
        MockMultipartFile file = sampleFile();
        DocumentExtraction extraction = new DocumentExtraction("text", Map.of());
        List<Chunk> chunks = List.of(new Chunk(1, "c1", Map.of()), new Chunk(2, "c2", Map.of()));

        when(extractor.extract(file)).thenReturn(extraction);
        when(chunkingService.chunk(anyString(), any())).thenReturn(chunks);

        DocumentIngestionResult result = service.ingest(file);

        assertThat(result.filename()).isEqualTo("report.pdf");
        assertThat(result.chunksPublished()).isEqualTo(2);
        assertThat(result.documentId()).isNotNull();
    }

    // -----------------------------------------------------------------------
    // Zero chunks — no Kafka send
    // -----------------------------------------------------------------------

    @Test
    void ingest_emptyDocument_noKafkaSend() throws IOException {
        MockMultipartFile file = sampleFile();
        when(extractor.extract(file)).thenReturn(new DocumentExtraction("", Map.of()));
        when(chunkingService.chunk(anyString(), any())).thenReturn(List.of());

        DocumentIngestionResult result = service.ingest(file);

        verify(kafkaTemplate, never()).send(anyString(), anyString(), any());
        assertThat(result.chunksPublished()).isZero();
    }

    // -----------------------------------------------------------------------
    // Kafka event field correctness
    // -----------------------------------------------------------------------

    @Test
    void ingest_chunkEventHasCorrectSourceType() throws IOException {
        MockMultipartFile file = sampleFile();
        DocumentExtraction extraction = new DocumentExtraction("text", Map.of());
        List<Chunk> chunks = List.of(new Chunk(1, "chunk content", Map.of()));

        when(extractor.extract(file)).thenReturn(extraction);
        when(chunkingService.chunk(anyString(), any())).thenReturn(chunks);

        ArgumentCaptor<ChunkCreatedEvent> captor = ArgumentCaptor.forClass(ChunkCreatedEvent.class);

        service.ingest(file);

        verify(kafkaTemplate).send(eq(Topics.DOCUMENT_CHUNK_CREATED), anyString(), captor.capture());
        ChunkCreatedEvent event = captor.getValue();

        assertThat(event.sourceType()).isEqualTo("DOCUMENT");
        assertThat(event.content()).isEqualTo("chunk content");
        assertThat(event.sequence()).isEqualTo(1);
        assertThat(event.sourceId()).isNotNull();
        assertThat(event.chunkId()).isNotNull();
    }

    // -----------------------------------------------------------------------
    // Null file guard
    // -----------------------------------------------------------------------

    @Test
    void ingest_nullFile_throwsNullPointerException() {
        assertThatThrownBy(() -> service.ingest(null))
                .isInstanceOf(NullPointerException.class);
    }

    // -----------------------------------------------------------------------
    // IO exception from extractor propagates
    // -----------------------------------------------------------------------

    @Test
    void ingest_extractorThrowsIOException_propagates() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(extractor.extract(file)).thenThrow(new IOException("parse failure"));

        assertThatThrownBy(() -> service.ingest(file))
                .isInstanceOf(IOException.class)
                .hasMessage("parse failure");
    }
}
