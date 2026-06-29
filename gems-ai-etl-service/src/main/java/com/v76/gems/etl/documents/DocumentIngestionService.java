package com.v76.gems.etl.documents;

import com.v76.gems.common.chunking.Chunk;
import com.v76.gems.common.chunking.ChunkingService;
import com.v76.gems.etl.extraction.DocumentClassifier;
import com.v76.gems.etl.extraction.DocumentExtraction;
import com.v76.gems.etl.extraction.DocumentExtractor;
import com.v76.gems.etl.extraction.OcrClient;
import com.v76.gems.etl.extraction.ProcessingStrategy;
import com.v76.gems.events.ChunkCreatedEvent;
import com.v76.gems.events.Topics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
public class DocumentIngestionService {
    private static final Logger log = LoggerFactory.getLogger(DocumentIngestionService.class);
    private final DocumentExtractor extractor;
    private final DocumentClassifier classifier;
    private final OcrClient ocrClient;
    private final ChunkingService chunkingService;
    private final KafkaTemplate<String, ChunkCreatedEvent> kafkaTemplate;

    public DocumentIngestionService(@NonNull DocumentExtractor extractor,
                                    @NonNull DocumentClassifier classifier,
                                    @NonNull OcrClient ocrClient,
                                    @NonNull ChunkingService chunkingService,
                                    @NonNull KafkaTemplate<String, ChunkCreatedEvent> kafkaTemplate) {
        this.extractor = Objects.requireNonNull(extractor);
        this.classifier = Objects.requireNonNull(classifier);
        this.ocrClient = Objects.requireNonNull(ocrClient);
        this.chunkingService = Objects.requireNonNull(chunkingService);
        this.kafkaTemplate = Objects.requireNonNull(kafkaTemplate);
    }

    public DocumentIngestionResult ingest(@NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);
        UUID documentId = UUID.randomUUID();
        log.info("Starting ingestion of document ID: {} for file: {}", documentId, file.getOriginalFilename());
        
        log.debug("Step 1: Extracting native text & metadata via Tika");
        DocumentExtraction extraction = extractor.extract(file);
        
        String mimeType = file.getContentType();
        if (mimeType == null || mimeType.isBlank()) {
            mimeType = (String) extraction.metadata().get("contentType");
        }

        log.debug("Step 2: Classifying document type and extraction strategy");
        ProcessingStrategy strategy = classifier.classify(file, extraction.text(), mimeType);

        String finalText = "";
        Map<String, Object> finalMetadata = new java.util.LinkedHashMap<>(extraction.metadata());

        // Retrieve extracted embedded images if present
        @SuppressWarnings("unchecked")
        List<byte[]> embeddedImages = (List<byte[]>) extraction.metadata().get("embeddedImages");

        if (strategy == ProcessingStrategy.OCR) {
            log.info("Executing OCR extraction flow for: {}", file.getOriginalFilename());
            if (embeddedImages != null && !embeddedImages.isEmpty()) {
                log.info("Found {} embedded images inside document. Performing page-by-page/image-by-image OCR.", embeddedImages.size());
                StringBuilder sb = new StringBuilder();
                int idx = 1;
                for (byte[] imgBytes : embeddedImages) {
                    try {
                        String ocrText = ocrClient.extractText(imgBytes, "page_" + idx + ".png", "image/png");
                        if (ocrText != null && !ocrText.isBlank()) {
                            sb.append("\n--- OCR Text (Image ").append(idx).append(") ---\n");
                            sb.append(ocrText).append("\n");
                        }
                    } catch (Exception e) {
                        log.warn("Failed to extract text from embedded image index: {}", idx, e);
                    }
                    idx++;
                }
                finalText = sb.toString().trim();
            } else {
                // If Tika extracted no embedded images (e.g., standard PNG/JPEG upload), send the file directly
                log.info("No embedded images found. Sending file directly to OCR service.");
                finalText = ocrClient.extractText(file);
            }
            finalMetadata.put("ocrApplied", "true");
        } else {
            // NATIVE_TEXT
            log.info("Executing Native Text extraction flow for: {}", file.getOriginalFilename());
            finalText = extraction.text();
            
            // If there are embedded images (e.g. inline images inside DOCX), perform hybrid OCR and append
            if (embeddedImages != null && !embeddedImages.isEmpty()) {
                log.info("Document is native text, but contains {} embedded images. Performing hybrid OCR merging.", embeddedImages.size());
                StringBuilder sb = new StringBuilder(finalText != null ? finalText : "");
                int idx = 1;
                for (byte[] imgBytes : embeddedImages) {
                    try {
                        String ocrText = ocrClient.extractText(imgBytes, "inline_" + idx + ".png", "image/png");
                        if (ocrText != null && !ocrText.isBlank()) {
                            sb.append("\n\n[Embedded Image ").append(idx).append(" OCR Extracted Text]:\n");
                            sb.append(ocrText);
                        }
                    } catch (Exception e) {
                        log.warn("Failed to extract text from inline image index: {}", idx, e);
                    }
                    idx++;
                }
                finalText = sb.toString();
                finalMetadata.put("ocrApplied", "hybrid");
            } else {
                finalMetadata.put("ocrApplied", "false");
            }
        }

        // Clean up the binary image data from metadata to avoid payload bloat in Kafka
        finalMetadata.remove("embeddedImages");
        
        log.debug("Step 3: Chunking processed text");
        List<Chunk> chunks = chunkingService.chunk(finalText, finalMetadata);
        log.info("Document ID: {} split into {} chunks", documentId, chunks.size());
        
        for (Chunk chunk : chunks) {
            UUID chunkId = UUID.randomUUID();
            ChunkCreatedEvent event = ChunkCreatedEvent.now(documentId, chunkId, "DOCUMENT", chunk.sequence(), chunk.content(), chunk.metadata());
            
            log.trace("Publishing chunk event to Kafka topic {}: Document ID: {}, Chunk ID: {}, Sequence: {}", 
                Topics.DOCUMENT_CHUNK_CREATED, documentId, chunkId, chunk.sequence());
            
            kafkaTemplate.send(
                java.util.Objects.requireNonNull(Topics.DOCUMENT_CHUNK_CREATED),
                java.util.Objects.requireNonNull(chunkId.toString()),
                event
            );
        }
        log.info("Finished ingestion for document ID: {}, all chunks published successfully", documentId);
        return new DocumentIngestionResult(documentId, file.getOriginalFilename(), chunks.size());
    }
}
