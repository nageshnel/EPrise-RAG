package com.v76.gems.gateway.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gateway.security")
public record GatewaySecurityProperties(String apiKeyHeader, String apiKey) {
    public GatewaySecurityProperties {
        if (apiKeyHeader == null || apiKeyHeader.isBlank()) {
            apiKeyHeader = "X-API-Key";
        }
    }
}
