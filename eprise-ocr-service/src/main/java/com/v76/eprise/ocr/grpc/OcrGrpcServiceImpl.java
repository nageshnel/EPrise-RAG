package com.v76.eprise.ocr.grpc;

import com.v76.eprise.ocr.OcrService;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Objects;

@GrpcService
public class OcrGrpcServiceImpl extends OcrGrpcServiceGrpc.OcrGrpcServiceImplBase {
    private static final Logger log = LoggerFactory.getLogger(OcrGrpcServiceImpl.class);
    private final OcrService ocrService;

    public OcrGrpcServiceImpl(OcrService ocrService) {
        this.ocrService = Objects.requireNonNull(ocrService);
    }

    @Override
    public void extractText(OcrRequest request, StreamObserver<OcrResponse> responseObserver) {
        log.info("Received gRPC OCR request for file: {}", request.getFilename());
        try {
            MultipartFile multipartFile = new ByteArrayMultipartFile(
                    request.getFileBytes().toByteArray(),
                    request.getFilename(),
                    request.getContentType()
            );
            
            String extractedText = ocrService.extractText(multipartFile);
            
            OcrResponse response = OcrResponse.newBuilder()
                    .setText(extractedText != null ? extractedText : "")
                    .build();
                    
            responseObserver.onNext(response);
            responseObserver.onCompleted();
            log.info("Successfully completed gRPC OCR request for: {}", request.getFilename());
        } catch (IOException e) {
            log.error("Failed to extract text via gRPC OCR service", e);
            responseObserver.onError(io.grpc.Status.INTERNAL
                    .withDescription("Failed to extract text: " + e.getMessage())
                    .asRuntimeException());
        }
    }
}
