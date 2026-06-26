package com.v76.gems.etl.documents;

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
class DocumentControllerTest {

    @Mock DocumentIngestionService ingestionService;

    @InjectMocks DocumentController controller;

    // -----------------------------------------------------------------------
    // Happy path
    // -----------------------------------------------------------------------

    @Test
    void upload_validFile_returnsIngestionResult() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.pdf", "application/pdf", "data".getBytes());
        DocumentIngestionResult expected = new DocumentIngestionResult(UUID.randomUUID(), "doc.pdf", 5);

        when(ingestionService.ingest(file)).thenReturn(expected);

        DocumentIngestionResult result = controller.upload(file);

        assertThat(result).isEqualTo(expected);
        verify(ingestionService).ingest(file);
    }

    // -----------------------------------------------------------------------
    // Null file guard
    // -----------------------------------------------------------------------

    @Test
    void upload_nullFile_throwsNullPointerException() {
        assertThatThrownBy(() -> controller.upload(null))
                .isInstanceOf(NullPointerException.class);
        verifyNoInteractions(ingestionService);
    }

    // -----------------------------------------------------------------------
    // IOException from service propagates
    // -----------------------------------------------------------------------

    @Test
    void upload_ioExceptionFromService_propagates() throws IOException {
        MultipartFile file = mock(MultipartFile.class);
        when(ingestionService.ingest(any())).thenThrow(new IOException("disk full"));

        assertThatThrownBy(() -> controller.upload(file))
                .isInstanceOf(IOException.class)
                .hasMessage("disk full");
    }
}
