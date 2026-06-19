package com.v76.gems.orchestrator;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class PromptBuilder {
    public String build(String question, List<RetrievedChunk> chunks) {
        String context = chunks.stream()
                .map(chunk -> "[sourceId=" + chunk.sourceId() + ", chunkId=" + chunk.chunkId() + ", sequence=" + chunk.sequence() + "]\n" + chunk.content())
                .collect(Collectors.joining("\n\n"));
        return """
                You are a helpful enterprise RAG assistant.
                Answer only from the supplied context. If context is insufficient, say you do not know.

                CONTEXT:
                %s

                QUESTION:
                %s
                """.formatted(context, question);
    }
}
