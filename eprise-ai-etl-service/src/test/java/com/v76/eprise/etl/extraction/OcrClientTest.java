package com.v76.eprise.etl.extraction;

import com.v76.eprise.ocr.grpc.OcrGrpcServiceGrpc;
import com.v76.eprise.ocr.grpc.OcrRequest;
import com.v76.eprise.ocr.grpc.OcrResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OcrClientTest {

    @Mock
    private OcrGrpcServiceGrpc.OcrGrpcServiceBlockingStub ocrStub;

    @InjectMocks
    private OcrClient ocrClient;

    @Test
    void extractText_callsGrpcService_returnsExtractedText() throws IOException {
        ReflectionTestUtils.setField(ocrClient, "ocrStub", ocrStub);

        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.png", "image/png", "png data".getBytes());

        OcrResponse grpcResponse = OcrResponse.newBuilder()
                .setText("extracted text content")
                .build();

        when(ocrStub.extractText(any(OcrRequest.class))).thenReturn(grpcResponse);

        String result = ocrClient.extractText(file);

        assertThat(result).isEqualTo("extracted text content");
    }
}
