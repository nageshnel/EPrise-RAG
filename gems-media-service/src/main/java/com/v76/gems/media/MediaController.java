package com.v76.gems.media;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.Objects;

@RestController
@RequestMapping("/media")
public class MediaController {
    private static final Logger log = LoggerFactory.getLogger(MediaController.class);
    private final MediaIngestionService ingestionService;

    public MediaController(@NonNull MediaIngestionService ingestionService) {
        this.ingestionService = Objects.requireNonNull(ingestionService);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MediaIngestionResult upload(@RequestPart("file") @NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);
        log.info("Received media upload request: {} (size: {} bytes, type: {})", file.getOriginalFilename(), file.getSize(), file.getContentType());
        MediaIngestionResult result = ingestionService.ingest(file);
        log.info("Media ingestion finished for: {} - Chunks Published: {}", file.getOriginalFilename(), result.chunksPublished());
        return result;
    }
}
