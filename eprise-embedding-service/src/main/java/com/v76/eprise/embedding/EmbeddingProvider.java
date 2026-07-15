package com.v76.eprise.embedding;

import org.springframework.lang.NonNull;

public interface EmbeddingProvider {
    @NonNull float[] embed(@NonNull String content);
}
