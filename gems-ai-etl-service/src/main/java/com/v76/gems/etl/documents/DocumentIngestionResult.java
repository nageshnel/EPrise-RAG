package com.v76.gems.etl.documents;

import java.util.UUID;

public record DocumentIngestionResult(UUID documentId, String filename, int chunksPublished) {
}
