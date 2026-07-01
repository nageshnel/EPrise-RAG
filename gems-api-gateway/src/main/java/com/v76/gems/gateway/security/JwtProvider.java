package com.v76.gems.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtProvider {
    private static final Logger log = LoggerFactory.getLogger(JwtProvider.class);
    private final SecretKey signingKey;
    private final JwtProperties properties;

    public JwtProvider(JwtProperties properties) {
        this.properties = properties;
        this.signingKey = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username, String role) {
        return generateToken(null, username, role);
    }

    public String generateToken(java.util.UUID userId, String username, String role) {
        log.info("Generating JWT token for user: {} (ID: {}) with role: {}", username, userId, role);
        Date now = new Date();
        Date expiry = new Date(now.getTime() + properties.expirationMs());

        var builder = Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuer(properties.issuer())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey);

        if (userId != null) {
            builder.claim("userId", userId.toString());
        }

        return builder.compact();
    }

    public Claims validateToken(String token) throws JwtException {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .requireIssuer(properties.issuer())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            log.debug("Successfully validated token for user: {}", claims.getSubject());
            return claims;
        } catch (JwtException e) {
            log.warn("Token validation failed: {}", e.getMessage());
            throw e;
        }
    }

    public String getUsernameFromToken(String token) {
        return validateToken(token).getSubject();
    }

    public String getRoleFromToken(String token) {
        return validateToken(token).get("role", String.class);
    }

    public long getExpirationMs() {
        return properties.expirationMs();
    }
}
