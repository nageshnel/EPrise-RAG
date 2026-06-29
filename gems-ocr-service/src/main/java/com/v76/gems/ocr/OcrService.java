package com.v76.gems.ocr;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.model.Media;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

@Service
public class OcrService {
    private static final Logger log = LoggerFactory.getLogger(OcrService.class);

    private final ChatModel chatModel;

    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    public OcrService(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public String extractText(@NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);
        String filename = file.getOriginalFilename();
        log.info("Extracting text from file: {} (size: {} bytes)", filename, file.getSize());

        if (apiKey == null || apiKey.isBlank() || apiKey.equals("change-me")) {
            log.warn("OPENAI_API_KEY is not set. Returning fallback mock OCR text.");
            return "Simulated OCR/VLM text extraction content for: " + filename 
                    + "\nLine 1: Sample Header\nLine 2: Invoice amount: $120.00\nLine 3: Status: Paid.";
        }

        try {
            byte[] fileBytes = file.getBytes();
            String contentType = file.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "image/png";
            }
            MimeType mimeType = MimeTypeUtils.parseMimeType(contentType);
            Media media = new Media(mimeType, new ByteArrayResource(fileBytes));

            UserMessage userMessage = new UserMessage(
                    "Extract all text from this image. Preserve layout, structure, and tabular data format as closely as possible. Output raw text without markdown container blocks unless tables are found.",
                    List.of(media)
            );

            log.info("Calling multimodal VLM for file: {}", filename);
            ChatResponse response = chatModel.call(new Prompt(userMessage));
            
            if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
                throw new IOException("Empty response from multimodal VLM model");
            }

            String extractedText = response.getResult().getOutput().getContent();
            log.info("Successfully extracted {} characters from {}", 
                    extractedText != null ? extractedText.length() : 0, filename);
            return extractedText;
        } catch (Exception e) {
            log.error("Failed to perform OCR extraction via VLM model for {}", filename, e);
            throw new IOException("Error during OCR/VLM processing: " + e.getMessage(), e);
        }
    }
}
