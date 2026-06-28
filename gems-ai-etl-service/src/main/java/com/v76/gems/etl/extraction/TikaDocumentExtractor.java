package com.v76.gems.etl.extraction;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class TikaDocumentExtractor implements DocumentExtractor {
    private static final Logger log = LoggerFactory.getLogger(TikaDocumentExtractor.class);
    private final Tika tika = new Tika();

    @Override
    public DocumentExtraction extract(MultipartFile file) throws IOException {
        log.info("Starting text extraction via Apache Tika for: {}", file.getOriginalFilename());
        Metadata tikaMetadata = new Metadata();
        tikaMetadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, file.getOriginalFilename());
        try (InputStream inputStream = file.getInputStream()) {
            String text;
            try {
                text = tika.parseToString(inputStream, tikaMetadata);
            } catch (TikaException e) {
                log.error("Apache Tika failed to parse document: {}", file.getOriginalFilename(), e);
                throw new IOException("Failed to parse document using Tika", e);
            }
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("filename", file.getOriginalFilename());
            metadata.put("contentType", file.getContentType());
            metadata.put("size", file.getSize());
            metadata.put("extractor", "apache-tika");
            log.info("Successfully extracted {} characters from {}", text != null ? text.length() : 0, file.getOriginalFilename());
            return new DocumentExtraction(text, metadata);
        }
    }
}
