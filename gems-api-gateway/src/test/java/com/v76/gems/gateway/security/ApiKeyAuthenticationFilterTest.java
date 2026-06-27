package com.v76.gems.gateway.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ApiKeyAuthenticationFilterTest {

    @Mock ServerWebExchange exchange;
    @Mock ServerHttpRequest request;
    @Mock ServerHttpResponse response;
    @Mock WebFilterChain chain;

    ApiKeyAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        when(exchange.getRequest()).thenReturn(request);
        when(exchange.getResponse()).thenReturn(response);
        when(chain.filter(any())).thenReturn(Mono.empty());
    }

    private void givenPath(String path) {
        org.springframework.http.server.RequestPath rp =
                mock(org.springframework.http.server.RequestPath.class);
        when(rp.value()).thenReturn(path);
        when(request.getPath()).thenReturn(rp);
    }

    private void givenHeaders(String authHeader, String apiKeyHeader) {
        HttpHeaders headers = new HttpHeaders();
        if (authHeader != null) headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        if (apiKeyHeader != null) headers.set("X-API-Key", apiKeyHeader);
        when(request.getHeaders()).thenReturn(headers);
    }

    private ApiKeyAuthenticationFilter filterWithKey(String key) {
        GatewaySecurityProperties props = new GatewaySecurityProperties("X-API-Key", key);
        return new ApiKeyAuthenticationFilter(props);
    }

    // -----------------------------------------------------------------------
    // Bypass paths
    // -----------------------------------------------------------------------

    @Test
    void filter_authPath_skipsApiKeyValidation() {
        filter = filterWithKey("valid-key");
        givenPath("/auth/register");

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(chain).filter(exchange);
    }

    @Test
    void filter_healthPath_skipsApiKeyValidation() {
        filter = filterWithKey("valid-key");
        givenPath("/actuator/health");

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(chain).filter(exchange);
    }

    // -----------------------------------------------------------------------
    // Bearer token present → skip to JWT filter
    // -----------------------------------------------------------------------

    @Test
    void filter_bearerTokenPresent_delegatesToChain() {
        filter = filterWithKey("valid-key");
        givenPath("/api/resource");
        givenHeaders("Bearer some-jwt", null);

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(chain).filter(exchange);
    }

    // -----------------------------------------------------------------------
    // API key not configured
    // -----------------------------------------------------------------------

    @Test
    void filter_noApiKeyConfigured_returns503() {
        filter = filterWithKey(null);  // no key configured
        givenPath("/api/resource");
        givenHeaders(null, null);
        when(response.setStatusCode(HttpStatus.SERVICE_UNAVAILABLE)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(response).setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
        verify(chain, never()).filter(any());
    }

    // -----------------------------------------------------------------------
    // Wrong key
    // -----------------------------------------------------------------------

    @Test
    void filter_wrongApiKey_returns401() {
        filter = filterWithKey("valid-key");
        givenPath("/api/resource");
        givenHeaders(null, "wrong-key");
        when(response.setStatusCode(HttpStatus.UNAUTHORIZED)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(response).setStatusCode(HttpStatus.UNAUTHORIZED);
    }

    // -----------------------------------------------------------------------
    // Correct key → security context set
    // -----------------------------------------------------------------------

    @Test
    void filter_correctApiKey_proceedsWithSecurityContext() {
        filter = filterWithKey("valid-key");
        givenPath("/api/resource");
        givenHeaders(null, "valid-key");

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(chain).filter(exchange);
        verify(response, never()).setStatusCode(any());
    }
}
