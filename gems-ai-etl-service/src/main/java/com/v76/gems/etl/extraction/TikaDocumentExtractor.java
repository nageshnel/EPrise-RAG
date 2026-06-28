package com.v76.gems.etl.extraction;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.metadata.TikaCoreProperties;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.Parser;
import org.apache.tika.parser.pdf.PDFParserConfig;
import org.apache.tika.parser.ocr.TesseractOCRConfig;
import org.apache.tika.sax.BodyContentHandler;
import jakarta.annotation.PostConstruct;
import org.apache.tika.config.TikaConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class TikaDocumentExtractor implements DocumentExtractor {
    private static final Logger log = LoggerFactory.getLogger(TikaDocumentExtractor.class);

    @Value("${tika.ocr.tesseract-path:}")
    private String tesseractPath;

    @Value("${tika.ocr.tessdata-path:}")
    private String tessdataPath;

    @Value("${tika.ocr.strategy:ocr_and_text_extraction}")
    private String ocrStrategy;

    private AutoDetectParser parser;

    @PostConstruct
    public void init() {
        log.info("Initializing Tika Document Extractor parser...");
        this.parser = buildParser();
    }

    private AutoDetectParser buildParser() {
        if ((tesseractPath == null || tesseractPath.isBlank())
                && (tessdataPath == null || tessdataPath.isBlank())) {
            log.info("Tesseract path/tessdata path not explicitly set. Relying on default AutoDetectParser (system PATH).");
            return new AutoDetectParser();
        }

        StringBuilder params = new StringBuilder();
        if (tesseractPath != null && !tesseractPath.isBlank()) {
            params.append("<param name=\"tesseractPath\" type=\"string\">")
                  .append(tesseractPath).append("</param>");
        }
        if (tessdataPath != null && !tessdataPath.isBlank()) {
            params.append("<param name=\"tessdataPath\" type=\"string\">")
                  .append(tessdataPath).append("</param>");
        }

        String configXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
                + "<properties><parsers>"
                + "<parser class=\"org.apache.tika.parser.ocr.TesseractOCRParser\">"
                + "<params>" + params + "</params>"
                + "</parser>"
                + "</parsers></properties>";

        try (InputStream is = new ByteArrayInputStream(configXml.getBytes(StandardCharsets.UTF_8))) {
            TikaConfig tikaConfig = new TikaConfig(is);
            return new AutoDetectParser(tikaConfig);
        } catch (Exception e) {
            log.warn("Failed to build TikaConfig with custom tesseract path, falling back to default AutoDetectParser", e);
            return new AutoDetectParser();
        }
    }

    @Override
    public DocumentExtraction extract(MultipartFile file) throws IOException {
        log.info("Starting text extraction via Apache Tika for: {}", file.getOriginalFilename());
        Metadata tikaMetadata = new Metadata();
        tikaMetadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, file.getOriginalFilename());

        ParseContext context = new ParseContext();

        // 1. Configure Tesseract OCR options
        TesseractOCRConfig ocrConfig = new TesseractOCRConfig();
        context.set(TesseractOCRConfig.class, ocrConfig);

        // 2. Configure PDF parser to perform OCR on scanned PDFs
        PDFParserConfig pdfConfig = new PDFParserConfig();
        String strategyStr = ocrStrategy != null ? ocrStrategy : "ocr_and_text_extraction";
        try {
            PDFParserConfig.OCR_STRATEGY strategy = PDFParserConfig.OCR_STRATEGY.valueOf(strategyStr.toUpperCase());
            pdfConfig.setOcrStrategy(strategy);
            log.info("Configuring Tika PDF OCR Strategy: {}", strategy);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid OCR strategy configured: {}. Falling back to default OCR_AND_TEXT_EXTRACTION.", ocrStrategy);
            pdfConfig.setOcrStrategy(PDFParserConfig.OCR_STRATEGY.OCR_AND_TEXT_EXTRACTION);
        }
        context.set(PDFParserConfig.class, pdfConfig);

        // Set the parser in context
        context.set(Parser.class, parser);

        try (InputStream inputStream = file.getInputStream()) {
            // Use BodyContentHandler with -1 to avoid character limits
            BodyContentHandler handler = new BodyContentHandler(-1);
            parser.parse(inputStream, handler, tikaMetadata, context);
            String text = handler.toString();

            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("filename", file.getOriginalFilename());
            metadata.put("contentType", file.getContentType());
            metadata.put("size", file.getSize());
            metadata.put("extractor", "apache-tika");

            log.info("Successfully extracted {} characters from {}", text != null ? text.length() : 0, file.getOriginalFilename());
            return new DocumentExtraction(text, metadata);
        } catch (Exception e) {
            log.error("Apache Tika failed to parse document: {}", file.getOriginalFilename(), e);
            throw new IOException("Failed to parse document using Tika", e);
        }
    }
}
