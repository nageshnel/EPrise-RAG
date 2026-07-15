package com.v76.eprise.gateway.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gateway.jwt")
public record JwtProperties(
        String secret,
        long expirationMs,
        String issuer
) {
    public JwtProperties {
        if (expirationMs <= 0) {
            expirationMs = 86400000L; // 24 hours default
        }
        if (issuer == null || issuer.isBlank()) {
            issuer = "eprise-api-gateway";
        }
    }
}
