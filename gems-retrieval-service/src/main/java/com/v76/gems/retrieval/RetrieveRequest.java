package com.v76.gems.retrieval;

import org.jspecify.annotations.NonNull;

public record RetrieveRequest(@NonNull String query, @NonNull Integer topK) {
}
