package com.v76.gems.etl.extraction;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;

import java.util.Locale;

@Component
public class DocumentClassifier {
    private static final Logger log = LoggerFactory.getLogger(DocumentClassifier.class);
    private static final int MIN_TEXT_LENGTH = 50;

    public ProcessingStrategy classify(@NonNull MultipartFile file, String extractedText, String detectedMimeType) {
        String filename = file.getOriginalFilename();
        String mimeType = detectedMimeType != null ? detectedMimeType.toLowerCase(Locale.ROOT) : "";

        log.info("Classifying document: {} (detected MIME: '{}', extracted text length: {})", 
                filename, mimeType, extractedText != null ? extractedText.length() : 0);

        // 1. Check if it is an image type
        if (mimeType.startsWith("image/")) {
            log.info("Document classified as OCR (Image file: {})", filename);
            return ProcessingStrategy.OCR;
        }

        // 2. Check if it is a PDF
        if (mimeType.equals("application/pdf")) {
            if (extractedText == null || extractedText.trim().length() < MIN_TEXT_LENGTH) {
                log.info("Document classified as OCR (Scanned/low-text PDF: {})", filename);
                return ProcessingStrategy.OCR;
            }
            
            log.info("Document classified as NATIVE_TEXT (Searchable PDF: {})", filename);
            return ProcessingStrategy.NATIVE_TEXT;
        }

        // 3. Default to native text extraction
        log.info("Document classified as NATIVE_TEXT (Standard document: {})", filename);
        return ProcessingStrategy.NATIVE_TEXT;
    }
}
