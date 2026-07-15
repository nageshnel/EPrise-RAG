package com.v76.eprise.etl.documents;

import java.util.UUID;

public record DocumentIngestionResult(UUID documentId, String filename, int chunksPublished) {
}
