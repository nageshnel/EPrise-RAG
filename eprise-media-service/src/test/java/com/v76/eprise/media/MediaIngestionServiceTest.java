package com.v76.eprise.media;

import com.v76.eprise.common.chunking.Chunk;
import com.v76.eprise.common.chunking.ChunkingService;
import com.v76.eprise.events.ChunkCreatedEvent;
import com.v76.eprise.events.Topics;
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

@SuppressWarnings({"null", "unchecked"})
@ExtendWith(MockitoExtension.class)
class MediaIngestionServiceTest {

    @Mock WhisperClient whisperClient;
    @Mock ChunkingService chunkingService;
    @Mock KafkaTemplate<String, ChunkCreatedEvent> kafkaTemplate;
    @Mock io.minio.MinioClient minioClient;
    @Mock com.v76.eprise.common.config.MinioProperties minioProperties;

    @InjectMocks MediaIngestionService service;

    @org.junit.jupiter.api.BeforeEach
    void setUp() throws Exception {
        lenient().when(minioProperties.bucket()).thenReturn("media");
        lenient().when(minioClient.bucketExists(any())).thenReturn(true);
    }

    private MockMultipartFile audioFile() {
        return new MockMultipartFile("file", "lecture.mp3", "audio/mpeg", "bytes".getBytes());
    }

    // -----------------------------------------------------------------------
    // Happy path — Kafka messages published
    // -----------------------------------------------------------------------

    @Test
    void ingest_validAudio_publishesMediaChunkEventsToKafka() throws IOException {
        MockMultipartFile file = audioFile();
        when(whisperClient.transcribe(file)).thenReturn("This is the transcript.");
        List<Chunk> chunks = List.of(new Chunk(1, "chunk one", Map.of()), new Chunk(2, "chunk two", Map.of()));
        when(chunkingService.chunk(anyString(), any())).thenReturn(chunks);

        service.ingest(file);

        verify(kafkaTemplate, times(2)).send(eq(Topics.MEDIA_CHUNK_CREATED), anyString(), any(ChunkCreatedEvent.class));
    }

    @Test
    void ingest_returnsCorrectResult() throws IOException {
        MockMultipartFile file = audioFile();
        when(whisperClient.transcribe(file)).thenReturn("transcript");
        List<Chunk> chunks = List.of(new Chunk(1, "c1", Map.of()));
        when(chunkingService.chunk(anyString(), any())).thenReturn(chunks);

        MediaIngestionResult result = service.ingest(file);

        assertThat(result.filename()).isEqualTo("lecture.mp3");
        assertThat(result.chunksPublished()).isEqualTo(1);
        assertThat(result.mediaId()).isNotNull();
    }

    // -----------------------------------------------------------------------
    // Empty transcript — no Kafka send
    // -----------------------------------------------------------------------

    @Test
    void ingest_emptyTranscript_noKafkaSend() throws IOException {
        MockMultipartFile file = audioFile();
        when(whisperClient.transcribe(file)).thenReturn("");
        when(chunkingService.chunk(anyString(), any())).thenReturn(List.of());

        MediaIngestionResult result = service.ingest(file);

        verify(kafkaTemplate, never()).send(anyString(), anyString(), any());
        assertThat(result.chunksPublished()).isZero();
    }

    // -----------------------------------------------------------------------
    // Metadata contents of Kafka event
    // -----------------------------------------------------------------------

    @Test
    void ingest_metadataContainsRequiredFields() throws IOException {
        MockMultipartFile file = audioFile();
        when(whisperClient.transcribe(file)).thenReturn("hello");
        List<Chunk> chunks = List.of(new Chunk(1, "hello", Map.of()));
        when(chunkingService.chunk(anyString(), any())).thenReturn(chunks);

        ArgumentCaptor<ChunkCreatedEvent> captor = ArgumentCaptor.forClass(ChunkCreatedEvent.class);
        service.ingest(file);
        verify(kafkaTemplate).send(anyString(), anyString(), captor.capture());

        ChunkCreatedEvent event = captor.getValue();
        assertThat(event.sourceType()).isEqualTo("MEDIA");
        assertThat(event.sequence()).isEqualTo(1);
        // Metadata passed to chunkingService should contain filename and contentType
        // We verify what the service PASSES to chunkingService via argument captor
        ArgumentCaptor<Map<String, Object>> metaCaptor = ArgumentCaptor.forClass(Map.class);
        verify(chunkingService).chunk(eq("hello"), metaCaptor.capture());
        Map<String, Object> meta = metaCaptor.getValue();
        assertThat(meta).containsKey("filename");
        assertThat(meta).containsKey("contentType");
        assertThat(meta).containsEntry("transcriptionProvider", "whisper-microservice");
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
    // WhisperClient IO exception propagates
    // -----------------------------------------------------------------------

    @Test
    void ingest_whisperClientThrowsIOException_propagates() throws IOException {
        MockMultipartFile file = audioFile();
        when(whisperClient.transcribe(file)).thenThrow(new IOException("whisper down"));

        assertThatThrownBy(() -> service.ingest(file))
                .isInstanceOf(IOException.class)
                .hasMessage("whisper down");
    }
}
