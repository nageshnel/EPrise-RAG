package com.v76.gems.orchestrator;

import org.springframework.lang.NonNull;
import java.util.UUID;

public record ChatRequest(@NonNull String question, UUID sessionId) {
}
