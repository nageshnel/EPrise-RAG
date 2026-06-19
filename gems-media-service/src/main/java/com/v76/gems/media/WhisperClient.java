package com.v76.gems.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.Objects;

@Component
public class WhisperClient {
    private final WebClient webClient;

    public WhisperClient(@NonNull WebClient.Builder builder,
            @Value("${services.whisper.url}") @NonNull String whisperUrl) {
        Objects.requireNonNull(builder);
        Objects.requireNonNull(whisperUrl);
        this.webClient = builder.baseUrl(whisperUrl).build();
    }

    public String transcribe(@NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);
        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };
        LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", resource);
        WhisperTranscriptResponse response = webClient.post()
                .uri("/transcribe")
                .contentType(java.util.Objects.requireNonNull(MediaType.MULTIPART_FORM_DATA))
                .body(BodyInserters.fromMultipartData(body))
                .retrieve()
                .bodyToMono(WhisperTranscriptResponse.class)
                .block();
        return response == null ? "" : response.text();
    }
}
