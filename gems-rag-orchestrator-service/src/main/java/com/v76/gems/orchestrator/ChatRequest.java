package com.v76.gems.orchestrator;

import org.springframework.lang.NonNull;

public record ChatRequest(@NonNull String question) {
}
