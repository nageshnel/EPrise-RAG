package com.v76.eprise.etl.extraction;

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
import org.apache.tika.extractor.EmbeddedDocumentExtractor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.xml.sax.ContentHandler;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class TikaDocumentExtractor implements DocumentExtractor {
    private static final Logger log = LoggerFactory.getLogger(TikaDocumentExtractor.class);

    private final AutoDetectParser parser;

    public TikaDocumentExtractor() {
        // Standard AutoDetectParser using standard classpath configurations.
        // We do not configure any native Tesseract here anymore.
        this.parser = new AutoDetectParser();
    }

    @Override
    public DocumentExtraction extract(MultipartFile file) throws IOException {
        log.info("Starting text extraction via Apache Tika for: {}", file.getOriginalFilename());
        Metadata tikaMetadata = new Metadata();
        tikaMetadata.set(TikaCoreProperties.RESOURCE_NAME_KEY, file.getOriginalFilename());

        ParseContext context = new ParseContext();

        // 1. Explicitly disable local Tesseract OCR
        TesseractOCRConfig ocrConfig = new TesseractOCRConfig();
        ocrConfig.setSkipOcr(true);
        context.set(TesseractOCRConfig.class, ocrConfig);

        // 2. Configure PDF parser to extract inline images (so classifier can detect them) but skip local OCR
        PDFParserConfig pdfConfig = new PDFParserConfig();
        pdfConfig.setExtractInlineImages(true);
        pdfConfig.setOcrStrategy(PDFParserConfig.OCR_STRATEGY.NO_OCR);
        context.set(PDFParserConfig.class, pdfConfig);

        // 3. Register our embedded document extractor to capture images
        ImageCollectingExtractor imageExtractor = new ImageCollectingExtractor();
        context.set(EmbeddedDocumentExtractor.class, imageExtractor);

        // Set the parser in context
        context.set(Parser.class, parser);

        try (InputStream inputStream = file.getInputStream()) {
            BodyContentHandler handler = new BodyContentHandler(-1);
            parser.parse(inputStream, handler, tikaMetadata, context);
            String text = handler.toString();

            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("filename", file.getOriginalFilename());
            metadata.put("contentType", file.getContentType());
            metadata.put("size", file.getSize());
            metadata.put("extractor", "apache-tika");
            
            // Add collected embedded images to metadata
            metadata.put("embeddedImages", imageExtractor.getImages());

            log.info("Successfully extracted {} characters and {} embedded images from {}", 
                    text != null ? text.length() : 0, imageExtractor.getImages().size(), file.getOriginalFilename());
            return new DocumentExtraction(text, metadata);
        } catch (Exception e) {
            log.error("Apache Tika failed to parse document: {}", file.getOriginalFilename(), e);
            throw new IOException("Failed to parse document using Tika", e);
        }
    }

    /**
     * Custom EmbeddedDocumentExtractor to intercept and collect images.
     */
    private static class ImageCollectingExtractor implements EmbeddedDocumentExtractor {
        private final List<byte[]> images = new ArrayList<>();

        public List<byte[]> getImages() {
            return images;
        }

        @Override
        public boolean shouldParseEmbedded(Metadata metadata) {
            String contentType = metadata.get(Metadata.CONTENT_TYPE);
            if (contentType != null && contentType.startsWith("image/")) {
                return true;
            }
            String resourceName = metadata.get(TikaCoreProperties.RESOURCE_NAME_KEY);
            if (resourceName != null) {
                String lower = resourceName.toLowerCase();
                return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif");
            }
            return false;
        }

        @Override
        public void parseEmbedded(InputStream stream, ContentHandler handler, Metadata metadata, boolean outputHtml) throws IOException {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int read;
            while ((read = stream.read(buffer)) != -1) {
                bos.write(buffer, 0, read);
            }
            images.add(bos.toByteArray());
        }
    }
}
