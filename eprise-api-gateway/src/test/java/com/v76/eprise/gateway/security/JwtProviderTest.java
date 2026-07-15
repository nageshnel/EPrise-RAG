package com.v76.eprise.gateway.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class JwtProviderTest {

    // Use a 32-byte secret for HMAC-SHA256
    private static final String SECRET = "test-secret-key-that-is-long-enough-32bytes!";
    private static final String ISSUER = "test-issuer";
    private static final long EXPIRATION_MS = 3_600_000L; // 1 hour

    private JwtProvider jwtProvider;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties(SECRET, EXPIRATION_MS, ISSUER);
        jwtProvider = new JwtProvider(properties);
    }

    // -----------------------------------------------------------------------
    // generateToken / validateToken — happy path
    // -----------------------------------------------------------------------

    @Test
    void generateToken_returnsNonBlankJwt() {
        String token = jwtProvider.generateToken("alice", "USER");
        assertThat(token).isNotBlank();
    }

    @Test
    void validateToken_validToken_returnsCorrectSubject() {
        String token = jwtProvider.generateToken("alice", "USER");
        assertThat(jwtProvider.validateToken(token).getSubject()).isEqualTo("alice");
    }

    @Test
    void validateToken_validToken_returnsCorrectRoleClaim() {
        String token = jwtProvider.generateToken("alice", "ADMIN");
        assertThat(jwtProvider.validateToken(token).get("role", String.class)).isEqualTo("ADMIN");
    }

    // -----------------------------------------------------------------------
    // Expired token
    // -----------------------------------------------------------------------

    @Test
    void validateToken_expiredToken_throwsJwtException() throws InterruptedException {
        // JwtProperties compact constructor sets expirationMs=86400000 when value<=0,
        // so we use 1ms (valid value) and sleep 5ms to guarantee expiry.
        JwtProperties shortProps = new JwtProperties(SECRET, 1L, ISSUER);
        JwtProvider shortProvider = new JwtProvider(shortProps);
        String expiredToken = shortProvider.generateToken("alice", "USER");
        Thread.sleep(5); // ensure the 1ms token has expired

        assertThatThrownBy(() -> jwtProvider.validateToken(expiredToken))
                .isInstanceOf(JwtException.class);
    }

    // -----------------------------------------------------------------------
    // Wrong secret
    // -----------------------------------------------------------------------

    @Test
    void validateToken_tokenSignedWithDifferentSecret_throwsJwtException() {
        JwtProperties otherProps = new JwtProperties("other-secret-key-that-is-long-enough-32b!", EXPIRATION_MS, ISSUER);
        JwtProvider otherProvider = new JwtProvider(otherProps);
        String foreignToken = otherProvider.generateToken("alice", "USER");

        assertThatThrownBy(() -> jwtProvider.validateToken(foreignToken))
                .isInstanceOf(JwtException.class);
    }

    // -----------------------------------------------------------------------
    // Wrong issuer
    // -----------------------------------------------------------------------

    @Test
    void validateToken_wrongIssuer_throwsJwtException() {
        JwtProperties otherProps = new JwtProperties(SECRET, EXPIRATION_MS, "different-issuer");
        JwtProvider otherProvider = new JwtProvider(otherProps);
        String foreignToken = otherProvider.generateToken("alice", "USER");

        assertThatThrownBy(() -> jwtProvider.validateToken(foreignToken))
                .isInstanceOf(JwtException.class);
    }

    // -----------------------------------------------------------------------
    // Convenience helpers
    // -----------------------------------------------------------------------

    @Test
    void getUsernameFromToken_returnsSubject() {
        String token = jwtProvider.generateToken("bob", "USER");
        assertThat(jwtProvider.getUsernameFromToken(token)).isEqualTo("bob");
    }

    @Test
    void getRoleFromToken_returnsRoleClaim() {
        String token = jwtProvider.generateToken("bob", "MANAGER");
        assertThat(jwtProvider.getRoleFromToken(token)).isEqualTo("MANAGER");
    }

    @Test
    void getExpirationMs_returnsConfiguredValue() {
        assertThat(jwtProvider.getExpirationMs()).isEqualTo(EXPIRATION_MS);
    }
}
