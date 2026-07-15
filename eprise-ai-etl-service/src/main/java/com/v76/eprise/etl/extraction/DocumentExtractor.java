package com.v76.eprise.etl.extraction;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface DocumentExtractor {
    DocumentExtraction extract(MultipartFile file) throws IOException;
}
