package com.v76.gems.common;

import com.v76.gems.common.chunking.ChunkingService;
import com.v76.gems.common.chunking.LangChain4jChunkingService;
import com.v76.gems.common.chunking.SplitterFactory;
import com.v76.gems.common.config.ChunkingProperties;
import com.v76.gems.common.config.EmbeddingApiProperties;
import com.v76.gems.common.config.RetrievalProperties;
import com.v76.gems.common.config.TextGenerationApiProperties;
import com.v76.gems.common.config.MinioProperties;
import io.minio.MinioClient;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@EnableConfigurationProperties({
    ChunkingProperties.class,
    EmbeddingApiProperties.class,
    RetrievalProperties.class,
    TextGenerationApiProperties.class,
    MinioProperties.class
})
public class AiCommonAutoConfiguration {
    @Bean
    SplitterFactory splitterFactory() {
        return new SplitterFactory();
    }

    @Bean
    ChunkingService chunkingService(ChunkingProperties properties, SplitterFactory splitterFactory) {
        return new LangChain4jChunkingService(properties, splitterFactory);
    }

    @Bean
    public MinioClient minioClient(MinioProperties properties) {
        return MinioClient.builder()
                .endpoint(properties.url())
                .credentials(properties.accessKey(), properties.secretKey())
                .build();
    }
}
