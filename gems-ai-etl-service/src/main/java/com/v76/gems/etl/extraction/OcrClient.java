package com.v76.gems.etl.extraction;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.Objects;

@Component
public class OcrClient {
    private static final Logger log = LoggerFactory.getLogger(OcrClient.class);

    private final WebClient webClient;

    public OcrClient(@NonNull WebClient.Builder webClientBuilder, @Value("${services.ocr.url:http://localhost:8086}") @NonNull String ocrServiceUrl) {
        log.info("Initializing OcrClient pointing to: {}", ocrServiceUrl);
        this.webClient = webClientBuilder.baseUrl(ocrServiceUrl).build();
    }

    public String extractText(@NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);
        return extractText(file.getBytes(), file.getOriginalFilename(), file.getContentType());
    }

    public String extractText(byte[] fileBytes, String filename, String contentType) throws IOException {
        Objects.requireNonNull(fileBytes);
        String name = filename != null ? filename : "image.png";
        String mimeType = contentType != null ? contentType : "image/png";

        log.info("Sending file '{}' to OCR service for text extraction (size: {} bytes)", name, fileBytes.length);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return name;
            }
        }, MediaType.parseMediaType(mimeType));

        final MediaType multipartFormData = MediaType.MULTIPART_FORM_DATA;
        if (multipartFormData == null) {
            throw new IllegalStateException("MediaType.MULTIPART_FORM_DATA is null");
        }

        try {
            return webClient.post()
                    .uri("/ocr/extract")
                    .contentType(multipartFormData)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            log.error("Failed to perform OCR extraction via ocr-service for file: {}", name, e);
            throw new IOException("OCR service request failed: " + e.getMessage(), e);
        }
    }
}
