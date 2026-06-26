package com.v76.gems.media;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaControllerTest {

    @Mock MediaIngestionService ingestionService;

    @InjectMocks MediaController controller;

    @Test
    void upload_validFile_returnsIngestionResult() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "audio.mp3", "audio/mpeg", "audio-bytes".getBytes());
        MediaIngestionResult expected = new MediaIngestionResult(UUID.randomUUID(), "audio.mp3", 3);

        when(ingestionService.ingest(file)).thenReturn(expected);

        MediaIngestionResult result = controller.upload(file);

        assertThat(result).isEqualTo(expected);
        verify(ingestionService).ingest(file);
    }

    @Test
    void upload_nullFile_throwsNullPointerException() {
        assertThatThrownBy(() -> controller.upload(null))
                .isInstanceOf(NullPointerException.class);
        verifyNoInteractions(ingestionService);
    }

    @Test
    void upload_ioExceptionFromService_propagates() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(ingestionService.ingest(any())).thenThrow(new IOException("storage error"));

        assertThatThrownBy(() -> controller.upload(file))
                .isInstanceOf(IOException.class)
                .hasMessage("storage error");
    }
}
