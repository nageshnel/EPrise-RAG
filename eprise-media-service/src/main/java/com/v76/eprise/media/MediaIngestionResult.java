package com.v76.eprise.media;

import java.util.UUID;

public record MediaIngestionResult(UUID mediaId, String filename, int chunksPublished) {
}
