package com.v76.eprise.common.chunking;

import com.v76.eprise.common.config.ChunkingProperties;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.segment.TextSegment;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LangChain4jChunkingServiceTest {

    @Mock ChunkingProperties properties;
    @Mock SplitterFactory splitterFactory;
    @Mock DocumentSplitter documentSplitter;

    // -----------------------------------------------------------------------
    // Null / blank content — early return
    // -----------------------------------------------------------------------

    @Test
    void chunk_nullContent_returnsEmptyList() {
        LangChain4jChunkingService service =
                new LangChain4jChunkingService(properties, splitterFactory);

        List<Chunk> result = service.chunk(null, Map.of());

        assertThat(result).isEmpty();
        verifyNoInteractions(splitterFactory);
    }

    @Test
    void chunk_blankContent_returnsEmptyList() {
        LangChain4jChunkingService service =
                new LangChain4jChunkingService(properties, splitterFactory);

        List<Chunk> result = service.chunk("   ", Map.of());

        assertThat(result).isEmpty();
        verifyNoInteractions(splitterFactory);
    }

    // -----------------------------------------------------------------------
    // Normal content — correct chunk count and sequence numbers
    // -----------------------------------------------------------------------

    @Test
    void chunk_normalContent_returnsCorrectChunkCount() {
        when(splitterFactory.create(properties)).thenReturn(documentSplitter);
        when(properties.strategy()).thenReturn("paragraph");
        when(documentSplitter.split(any())).thenReturn(List.of(
                TextSegment.from("seg1"),
                TextSegment.from("seg2"),
                TextSegment.from("seg3")
        ));

        LangChain4jChunkingService service =
                new LangChain4jChunkingService(properties, splitterFactory);

        List<Chunk> chunks = service.chunk("Some multi-segment content.", Map.of());

        assertThat(chunks).hasSize(3);
    }

    @Test
    void chunk_normalContent_sequencesStartAtOne() {
        when(splitterFactory.create(properties)).thenReturn(documentSplitter);
        when(properties.strategy()).thenReturn("paragraph");
        when(documentSplitter.split(any())).thenReturn(List.of(
                TextSegment.from("first"),
                TextSegment.from("second")
        ));

        LangChain4jChunkingService service =
                new LangChain4jChunkingService(properties, splitterFactory);

        List<Chunk> chunks = service.chunk("content", Map.of());

        assertThat(chunks.get(0).sequence()).isEqualTo(1);
        assertThat(chunks.get(1).sequence()).isEqualTo(2);
    }

    @Test
    void chunk_normalContent_textMatchesSegment() {
        when(splitterFactory.create(properties)).thenReturn(documentSplitter);
        when(properties.strategy()).thenReturn("sentence");
        when(documentSplitter.split(any())).thenReturn(List.of(TextSegment.from("Hello.")));

        LangChain4jChunkingService service =
                new LangChain4jChunkingService(properties, splitterFactory);

        List<Chunk> chunks = service.chunk("Hello.", Map.of());

        assertThat(chunks.get(0).content()).isEqualTo("Hello.");
    }

    // -----------------------------------------------------------------------
    // Metadata merging
    // -----------------------------------------------------------------------

    @Test
    void chunk_metadataContainsChunkingStrategy() {
        when(splitterFactory.create(properties)).thenReturn(documentSplitter);
        when(properties.strategy()).thenReturn("sentence");
        when(documentSplitter.split(any())).thenReturn(List.of(TextSegment.from("text")));

        LangChain4jChunkingService service =
                new LangChain4jChunkingService(properties, splitterFactory);

        List<Chunk> chunks = service.chunk("text", Map.of());

        assertThat(chunks.get(0).metadata()).containsEntry("chunkingStrategy", "sentence");
    }

    @Test
    void chunk_inheritsInputMetadata() {
        when(splitterFactory.create(properties)).thenReturn(documentSplitter);
        when(properties.strategy()).thenReturn("paragraph");
        when(documentSplitter.split(any())).thenReturn(List.of(TextSegment.from("seg")));

        LangChain4jChunkingService service =
                new LangChain4jChunkingService(properties, splitterFactory);

        Map<String, Object> inputMeta = Map.of("filename", "report.pdf", "size", 1024);
        List<Chunk> chunks = service.chunk("content", inputMeta);

        assertThat(chunks.get(0).metadata())
                .containsEntry("filename", "report.pdf")
                .containsEntry("size", 1024);
    }

    @Test
    void chunk_nullMetadata_handledGracefully() {
        when(splitterFactory.create(properties)).thenReturn(documentSplitter);
        when(properties.strategy()).thenReturn("paragraph");
        when(documentSplitter.split(any())).thenReturn(List.of(TextSegment.from("seg")));

        LangChain4jChunkingService service =
                new LangChain4jChunkingService(properties, splitterFactory);

        assertThatCode(() -> service.chunk("content", null)).doesNotThrowAnyException();
    }
}
