package com.v76.gems.ocr;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class OcrServiceTest {

    @Mock ChatModel chatModel;

    @InjectMocks OcrService ocrService;

    @Test
    void extractText_withNoApiKey_returnsMockFallbackText() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "image content".getBytes());
        
        String result = ocrService.extractText(file);
        
        assertThat(result).contains("Simulated OCR/VLM text extraction");
    }
}
