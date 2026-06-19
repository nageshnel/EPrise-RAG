package com.v76.gems.etl.extraction;

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
    private final Tika tika = new Tika();

    @Override
    public DocumentExtraction extract(MultipartFile file) throws IOException {
        Metadata tikaMetadata = new Metadata();
        tikaMetadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, file.getOriginalFilename());
        try (InputStream inputStream = file.getInputStream()) {
            String text;
            try {
                text = tika.parseToString(inputStream, tikaMetadata);
            } catch (TikaException e) {
                throw new IOException("Failed to parse document using Tika", e);
            }
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("filename", file.getOriginalFilename());
            metadata.put("contentType", file.getContentType());
            metadata.put("size", file.getSize());
            metadata.put("extractor", "apache-tika");
            return new DocumentExtraction(text, metadata);
        }
    }
}
