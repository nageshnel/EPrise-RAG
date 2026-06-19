package com.v76.gems.media;

import java.util.UUID;

public record MediaIngestionResult(UUID mediaId, String filename, int chunksPublished) {
}
