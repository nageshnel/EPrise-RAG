package com.v76.gems.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai.minio")
public record MinioProperties(String url, String accessKey, String secretKey, String bucket) {
    public MinioProperties {
        if (url == null || url.isBlank()) {
            url = "http://localhost:9000";
        }
        if (accessKey == null || accessKey.isBlank()) {
            accessKey = "gems";
        }
        if (secretKey == null || secretKey.isBlank()) {
            secretKey = "gems-password";
        }
        if (bucket == null || bucket.isBlank()) {
            bucket = "documents";
        }
    }
}
