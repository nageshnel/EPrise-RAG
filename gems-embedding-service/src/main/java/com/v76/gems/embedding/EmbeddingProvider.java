package com.v76.gems.embedding;

import org.springframework.lang.NonNull;

public interface EmbeddingProvider {
    @NonNull float[] embed(@NonNull String content);
}
