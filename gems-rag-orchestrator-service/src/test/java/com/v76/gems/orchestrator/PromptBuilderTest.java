package com.v76.gems.orchestrator;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class PromptBuilderTest {

    private PromptBuilder builder;

    @BeforeEach
    void setUp() {
        builder = new PromptBuilder();
    }

    private RetrievedChunk chunk(String content, int seq) {
        return new RetrievedChunk(UUID.randomUUID(), UUID.randomUUID(),
                "DOCUMENT", seq, content, 0.1, Map.of());
    }

    // -----------------------------------------------------------------------
    // Single chunk
    // -----------------------------------------------------------------------

    @Test
    void build_singleChunk_includesChunkContentInPrompt() {
        RetrievedChunk c = chunk("RAG stands for Retrieval-Augmented Generation.", 1);
        String prompt = builder.build("What is RAG?", List.of(c));

        assertThat(prompt).contains("RAG stands for Retrieval-Augmented Generation.");
    }

    @Test
    void build_singleChunk_includesMetadataFields() {
        RetrievedChunk c = chunk("content", 1);
        String prompt = builder.build("Q?", List.of(c));

        assertThat(prompt).contains("sourceId=" + c.sourceId());
        assertThat(prompt).contains("chunkId=" + c.chunkId());
        assertThat(prompt).contains("sequence=" + c.sequence());
    }

    // -----------------------------------------------------------------------
    // Multiple chunks
    // -----------------------------------------------------------------------

    @Test
    void build_multipleChunks_allIncludedInContext() {
        List<RetrievedChunk> chunks = List.of(
                chunk("First chunk text.", 1),
                chunk("Second chunk text.", 2),
                chunk("Third chunk text.", 3)
        );
        String prompt = builder.build("Question?", chunks);

        assertThat(prompt)
                .contains("First chunk text.")
                .contains("Second chunk text.")
                .contains("Third chunk text.");
    }

    // -----------------------------------------------------------------------
    // Empty chunks
    // -----------------------------------------------------------------------

    @Test
    void build_emptyChunkList_contextSectionIsEmpty() {
        String prompt = builder.build("What is AI?", List.of());

        assertThat(prompt).contains("CONTEXT:");
        // No chunk text should appear
        assertThat(prompt).doesNotContain("sourceId=");
    }

    // -----------------------------------------------------------------------
    // Question appears in prompt
    // -----------------------------------------------------------------------

    @Test
    void build_questionAppearsInQuestionSection() {
        String prompt = builder.build("Explain embeddings.", List.of());

        assertThat(prompt).contains("QUESTION:");
        assertThat(prompt).contains("Explain embeddings.");
    }

    // -----------------------------------------------------------------------
    // Prompt contains assistant instructions
    // -----------------------------------------------------------------------

    @Test
    void build_promptContainsAssistantInstructions() {
        String prompt = builder.build("?", List.of());

        assertThat(prompt).containsIgnoringCase("enterprise RAG assistant");
        assertThat(prompt).containsIgnoringCase("context");
    }

    @Test
    void build_withHistory_includesHistoryInPrompt() {
        List<ChatMessage> history = List.of(
            new ChatMessage(UUID.randomUUID(), UUID.randomUUID(), "USER", "Hello", "[]", java.time.Instant.now()),
            new ChatMessage(UUID.randomUUID(), UUID.randomUUID(), "ASSISTANT", "Hi there!", "[]", java.time.Instant.now())
        );
        String prompt = builder.build("How are you?", List.of(), history);

        assertThat(prompt).contains("CONVERSATION HISTORY:");
        assertThat(prompt).contains("USER: Hello");
        assertThat(prompt).contains("ASSISTANT: Hi there!");
    }
}
