package com.v76.gems.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.lang.NonNull;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.Objects;

@Component
public class WhisperClient {
    private final WebClient webClient;

    private final String apiKey;

    public WhisperClient(@NonNull WebClient.Builder builder,
            @Value("${services.whisper.url}") @NonNull String whisperUrl,
            @Value("${services.whisper.api-key:}") String apiKey) {
        Objects.requireNonNull(builder);
        Objects.requireNonNull(whisperUrl);
        this.webClient = builder.baseUrl(whisperUrl).build();
        this.apiKey = apiKey;
    }

    public String transcribe(@NonNull MultipartFile file) throws IOException {
        Objects.requireNonNull(file);

        String base64Data = java.util.Base64.getEncoder().encodeToString(file.getBytes());
        String originalFilename = file.getOriginalFilename();
        String format = "wav"; // fallback
        if (originalFilename != null && originalFilename.contains(".")) {
            format = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }

        java.util.Map<String, Object> inputAudio = java.util.Map.of(
                "data", base64Data,
                "format", format);
        java.util.Map<String, Object> requestBody = java.util.Map.of(
                "model", "openai/whisper-large-v3-turbo",
                "input_audio", inputAudio);

        final MediaType application_JSON2 = MediaType.APPLICATION_JSON;
        if (application_JSON2 != null) {
            var requestSpec = webClient.post()
                    .uri("/audio/transcriptions")
                    .contentType(application_JSON2);
            if (apiKey != null && !apiKey.isBlank()) {
                requestSpec = requestSpec.header("Authorization", "Bearer " + apiKey);
            }

            WhisperTranscriptResponse response = requestSpec
                    .bodyValue(java.util.Objects.requireNonNull(requestBody))
                    .retrieve()
                    .bodyToMono(WhisperTranscriptResponse.class)
                    .block();
            if (response == null) {
                return "";
            }
            return response.text();
        } else {
            return "";
        }
    }
}
