package com.v76.gems.orchestrator;

import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Objects;

@Service
public class ChatService {
    private final RetrievalClient retrievalClient;
    private final PromptBuilder promptBuilder;
    private final TextGenerationClient textGenerationClient;

    public ChatService(@NonNull RetrievalClient retrievalClient, @NonNull PromptBuilder promptBuilder, @NonNull TextGenerationClient textGenerationClient) {
        this.retrievalClient = Objects.requireNonNull(retrievalClient);
        this.promptBuilder = Objects.requireNonNull(promptBuilder);
        this.textGenerationClient = Objects.requireNonNull(textGenerationClient);
    }

    public ChatResponse chat(@NonNull ChatRequest request) {
        Objects.requireNonNull(request);
        RetrieveResponse retrieveResponse = retrievalClient.retrieve(request.question());
        List<RetrievedChunk> chunks = retrieveResponse == null || retrieveResponse.chunks() == null ? List.of() : retrieveResponse.chunks();
        String prompt = promptBuilder.build(request.question(), chunks);
        String answer = textGenerationClient.complete(prompt);
        List<SourceCitation> sources = chunks.stream()
                .map(chunk -> new SourceCitation(chunk.chunkId(), chunk.sourceId(), chunk.sourceType(), chunk.sequence(), chunk.metadata()))
                .toList();
        return new ChatResponse(answer, sources);
    }
}
