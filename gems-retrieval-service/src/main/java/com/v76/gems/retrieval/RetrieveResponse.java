package com.v76.gems.retrieval;

import java.util.List;

public record RetrieveResponse(List<SearchResult> chunks) {
}
