package com.v76.gems.orchestrator;

import java.util.List;

public record ChatResponse(String answer, List<SourceCitation> sources) {
}
