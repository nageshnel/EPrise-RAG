package com.v76.gems.ocr;

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
@RequestMapping("/ocr")
public class OcrController {
    private static final Logger log = LoggerFactory.getLogger(OcrController.class);
    private final OcrService ocrService;

    public OcrController(@NonNull OcrService ocrService) {
        this.ocrService = Objects.requireNonNull(ocrService);
    }

    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public String extract(@RequestPart("file") @NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);
        log.info("Received OCR request for file: {}", file.getOriginalFilename());
        return ocrService.extractText(file);
    }
}
