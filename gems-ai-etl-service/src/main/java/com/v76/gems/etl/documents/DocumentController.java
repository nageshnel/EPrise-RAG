package com.v76.gems.etl.documents;

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
@RequestMapping("/documents")
public class DocumentController {
    private final DocumentIngestionService ingestionService;

    public DocumentController(@NonNull DocumentIngestionService ingestionService) {
        this.ingestionService = Objects.requireNonNull(ingestionService);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentIngestionResult upload(@RequestPart("file") @NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);
        return ingestionService.ingest(file);
    }
}
