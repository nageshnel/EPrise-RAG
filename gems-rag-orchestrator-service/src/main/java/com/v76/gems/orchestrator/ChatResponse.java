package com.v76.gems.orchestrator;

import java.util.List;
import java.util.UUID;

public record ChatResponse(String answer, List<SourceCitation> sources, UUID sessionId) {
}
