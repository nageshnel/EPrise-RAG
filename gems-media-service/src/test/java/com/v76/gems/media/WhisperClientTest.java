package com.v76.gems.media;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WhisperClientTest {

    // We mock the entire WebClient chain to avoid actual HTTP calls
    @Mock WebClient webClient;
    @Mock WebClient.RequestBodyUriSpec requestBodyUriSpec;
    @Mock WebClient.RequestBodySpec requestBodySpec;
    @Mock WebClient.RequestHeadersSpec<?> requestHeadersSpec;
    @Mock WebClient.ResponseSpec responseSpec;

    WhisperClient whisperClient;

    @BeforeEach
    void setUp() {
        // Manually inject the mocked webClient via a test-visible builder approach.
        // We spy on WebClient.Builder so we can intercept baseUrl().
        WebClient.Builder builder = mock(WebClient.Builder.class);
        when(builder.baseUrl(anyString())).thenReturn(builder);
        when(builder.build()).thenReturn(webClient);

        whisperClient = new WhisperClient(builder, "http://whisper:9000", "test-key");

        // Wire up the WebClient call chain
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.contentType(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), any())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
    }

    // -----------------------------------------------------------------------
    // Happy path
    // -----------------------------------------------------------------------

    @Test
    void transcribe_successfulResponse_returnsText() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "speech.mp3", "audio/mpeg", "audio-bytes".getBytes());
        WhisperTranscriptResponse whisperResponse = new WhisperTranscriptResponse("hello world");

        when(responseSpec.bodyToMono(WhisperTranscriptResponse.class))
                .thenReturn(Mono.just(whisperResponse));

        String result = whisperClient.transcribe(file);

        assertThat(result).isEqualTo("hello world");
    }

    // -----------------------------------------------------------------------
    // Null response body → empty string
    // -----------------------------------------------------------------------

    @Test
    void transcribe_nullResponseBody_returnsEmptyString() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "silence.mp3", "audio/mpeg", "bytes".getBytes());

        when(responseSpec.bodyToMono(WhisperTranscriptResponse.class))
                .thenReturn(Mono.empty());

        String result = whisperClient.transcribe(file);

        assertThat(result).isEmpty();
    }

    // -----------------------------------------------------------------------
    // IO exception reading bytes
    // -----------------------------------------------------------------------

    @Test
    void transcribe_ioExceptionReadingBytes_propagates() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(file.getBytes()).thenThrow(new IOException("read error"));

        assertThatThrownBy(() -> whisperClient.transcribe(file))
                .isInstanceOf(IOException.class)
                .hasMessage("read error");
    }
}
