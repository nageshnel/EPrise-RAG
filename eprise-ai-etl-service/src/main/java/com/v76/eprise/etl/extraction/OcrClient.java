package com.v76.eprise.etl.extraction;

import com.v76.eprise.ocr.grpc.OcrGrpcServiceGrpc;
import com.v76.eprise.ocr.grpc.OcrRequest;
import com.v76.eprise.ocr.grpc.OcrResponse;
import com.google.protobuf.ByteString;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.Objects;

@Component
public class OcrClient {
    private static final Logger log = LoggerFactory.getLogger(OcrClient.class);

    @GrpcClient("ocr-service")
    private OcrGrpcServiceGrpc.OcrGrpcServiceBlockingStub ocrStub;

    public String extractText(@NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);
        return extractText(file.getBytes(), file.getOriginalFilename(), file.getContentType());
    }

    public String extractText(byte[] fileBytes, String filename, String contentType) throws IOException {
        Objects.requireNonNull(fileBytes);
        String name = filename != null ? filename : "image.png";
        String mimeType = contentType != null ? contentType : "image/png";

        log.info("Sending file '{}' to OCR service via gRPC for text extraction (size: {} bytes)", name, fileBytes.length);

        try {
            OcrRequest request = OcrRequest.newBuilder()
                    .setFileBytes(ByteString.copyFrom(fileBytes))
                    .setFilename(name)
                    .setContentType(mimeType)
                    .build();

            OcrResponse response = ocrStub.extractText(request);
            String extractedText = response.getText();
            log.info("Successfully received gRPC OCR text extraction response ({} characters)", 
                    extractedText != null ? extractedText.length() : 0);
            return extractedText;
        } catch (Exception e) {
            log.error("Failed to perform OCR extraction via gRPC for file: {}", name, e);
            throw new IOException("gRPC OCR service request failed: " + e.getMessage(), e);
        }
    }
}
