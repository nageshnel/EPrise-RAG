package com.v76.eprise.etl.extraction;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TikaDocumentExtractorTest {

    private TikaDocumentExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new TikaDocumentExtractor();
    }

    // -----------------------------------------------------------------------
    // Happy path: plain text
    // -----------------------------------------------------------------------

    @Test
    void extract_plainTextFile_returnsExtractedText() throws IOException {
        String content = "Hello world, this is a plain text document.";
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", "text/plain", content.getBytes());

        DocumentExtraction result = extractor.extract(file);

        assertThat(result.text()).contains("Hello world");
    }

    @Test
    void extract_plainTextFile_populatesMetadata() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "sample.txt", "text/plain", "content".getBytes());

        DocumentExtraction result = extractor.extract(file);

        assertThat(result.metadata())
                .containsKey("filename")
                .containsKey("contentType")
                .containsKey("size")
                .containsEntry("extractor", "apache-tika");
    }

    @Test
    void extract_setsFilenameInMetadata() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "report.txt", "text/plain", "report content".getBytes());

        DocumentExtraction result = extractor.extract(file);

        assertThat(result.metadata().get("filename")).isEqualTo("report.txt");
    }

    @Test
    void extract_setsContentTypeInMetadata() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.txt", "text/plain", "data".getBytes());

        DocumentExtraction result = extractor.extract(file);

        assertThat(result.metadata().get("contentType")).isEqualTo("text/plain");
    }

    // -----------------------------------------------------------------------
    // Null filename handled gracefully
    // -----------------------------------------------------------------------

    @Test
    void extract_nullFilename_noNullPointerException() throws IOException {
        // MockMultipartFile with null original filename
        MockMultipartFile file = new MockMultipartFile(
                "file", null, "text/plain", "content here".getBytes());

        assertThatCode(() -> extractor.extract(file)).doesNotThrowAnyException();
    }

    // -----------------------------------------------------------------------
    // IO error (stream that throws)
    // -----------------------------------------------------------------------

    @Test
    void extract_inputStreamThrowsIOException_propagatesAsIOException() throws IOException {
        MultipartFile badFile = mock(MultipartFile.class);
        when(badFile.getOriginalFilename()).thenReturn("bad.bin");
        when(badFile.getInputStream()).thenThrow(new IOException("disk error"));

        assertThatThrownBy(() -> extractor.extract(badFile))
                .isInstanceOf(IOException.class);
    }
}
