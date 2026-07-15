package com.v76.eprise.retrieval;

import org.jspecify.annotations.NonNull;

public record RetrieveRequest(@NonNull String query, @NonNull Integer topK) {
}
