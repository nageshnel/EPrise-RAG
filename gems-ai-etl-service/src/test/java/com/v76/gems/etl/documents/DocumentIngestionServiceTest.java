package com.v76.gems.etl.documents;

import com.v76.gems.common.chunking.Chunk;
import com.v76.gems.common.chunking.ChunkingService;
import com.v76.gems.common.config.MinioProperties;
import com.v76.gems.etl.extraction.DocumentClassifier;
import com.v76.gems.etl.extraction.DocumentExtraction;
import com.v76.gems.etl.extraction.DocumentExtractor;
import com.v76.gems.etl.extraction.OcrClient;
import com.v76.gems.etl.extraction.ProcessingStrategy;
import com.v76.gems.events.ChunkCreatedEvent;
import com.v76.gems.events.Topics;
import io.minio.MinioClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.mock.web.MockMultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class DocumentIngestionServiceTest {

    @Mock
    DocumentExtractor extractor;
    @Mock
    DocumentClassifier classifier;
    @Mock
    OcrClient ocrClient;
    @Mock
    ChunkingService chunkingService;
    @Mock
    KafkaTemplate<String, ChunkCreatedEvent> kafkaTemplate;
    @Mock
    MinioClient minioClient;
    @Mock
    MinioProperties minioProperties;

    @InjectMocks
    DocumentIngestionService service;

    @BeforeEach
    void setUp() throws Exception {
        lenient().when(classifier.classify(any(), any(), any())).thenReturn(ProcessingStrategy.NATIVE_TEXT);
        lenient().when(minioProperties.bucket()).thenReturn("documents");
        lenient().when(minioClient.bucketExists(any())).thenReturn(true);
    }

    private MockMultipartFile sampleFile() {
        return new MockMultipartFile("file", "report.pdf", "application/pdf", "pdf content".getBytes());
    }

    // -----------------------------------------------------------------------
    // Happy path — Kafka messages published
    // -----------------------------------------------------------------------

    @Test
    void ingest_validFile_publishesChunkEventsToKafka() throws IOException {
        MockMultipartFile file = sampleFile();
        DocumentExtraction extraction = new DocumentExtraction("Extracted text",
                Map.of("contentType", "application/pdf"));
        List<Chunk> chunks = List.of(
                new Chunk(1, "chunk 1", Map.of()),
                new Chunk(2, "chunk 2", Map.of()),
                new Chunk(3, "chunk 3", Map.of()));

        when(extractor.extract(file)).thenReturn(extraction);
        when(chunkingService.chunk(eq("Extracted text"), any())).thenReturn(chunks);

        service.ingest(file);

        verify(kafkaTemplate, times(3)).send(eq(Topics.DOCUMENT_CHUNK_CREATED), anyString(),
                any(ChunkCreatedEvent.class));
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
        MockMultipartFile file = sampleFile();
        when(extractor.extract(file)).thenThrow(new IOException("parse failure"));

        assertThatThrownBy(() -> service.ingest(file))
                .isInstanceOf(IOException.class)
                .hasMessage("parse failure");
    }

    @Test
    void ingest_nativeTextWithEmbeddedImages_performsParallelOcrAndPersistsImagesToMinio() throws Exception {
        MockMultipartFile file = sampleFile();
        byte[] img1 = "img1".getBytes();
        byte[] img2 = "img2".getBytes();
        DocumentExtraction extraction = new DocumentExtraction(
                "Native text content.",
                Map.of("embeddedImages", List.of(img1, img2)));

        when(extractor.extract(file)).thenReturn(extraction);
        when(classifier.classify(any(), any(), any())).thenReturn(ProcessingStrategy.NATIVE_TEXT);
        when(ocrClient.extractText(eq(img1), anyString(), anyString())).thenReturn("OCR Text 1");
        when(ocrClient.extractText(eq(img2), anyString(), anyString())).thenReturn("OCR Text 2");

        ArgumentCaptor<String> textCaptor = ArgumentCaptor.forClass(String.class);
        when(chunkingService.chunk(textCaptor.capture(), any()))
                .thenReturn(List.of(new Chunk(1, "chunk text", Map.of())));

        service.ingest(file);

        // Verify images were uploaded to MinIO (1 original file + 2 embedded images)
        verify(minioClient, times(3)).putObject(any(io.minio.PutObjectArgs.class));

        // Verify final concatenated text contains OCR text and image paths
        String finalText = textCaptor.getValue();
        assertThat(finalText).contains("Native text content.");
        assertThat(finalText).contains("[Embedded Image 1 Storage Path: documents/");
        assertThat(finalText).contains("OCR Text 1");
        assertThat(finalText).contains("OCR Text 2");
    }
}
