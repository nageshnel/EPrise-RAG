package com.v76.eprise.gateway.security;

import io.jsonwebtoken.JwtException;
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
class JwtAuthenticationFilterTest {

    @Mock JwtProvider jwtProvider;
    @Mock ServerWebExchange exchange;
    @Mock ServerHttpRequest request;
    @Mock ServerHttpResponse response;
    @Mock WebFilterChain chain;

    JwtAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new JwtAuthenticationFilter(jwtProvider);
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

    private void givenAuthHeader(String value) {
        HttpHeaders headers = new HttpHeaders();
        if (value != null) {
            headers.set(HttpHeaders.AUTHORIZATION, value);
        }
        when(request.getHeaders()).thenReturn(headers);
    }

    // -----------------------------------------------------------------------
    // Paths that bypass auth
    // -----------------------------------------------------------------------

    @Test
    void filter_authPath_skipsAuthentication() {
        givenPath("/auth/login");

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(jwtProvider, never()).validateToken(any());
        verify(chain).filter(exchange);
    }

    @Test
    void filter_healthPath_skipsAuthentication() {
        givenPath("/actuator/health");

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(jwtProvider, never()).validateToken(any());
    }

    // -----------------------------------------------------------------------
    // No Bearer header — pass through to ApiKeyFilter
    // -----------------------------------------------------------------------

    @Test
    void filter_noBearerHeader_delegatesToChain() {
        givenPath("/api/resource");
        givenAuthHeader(null);

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(jwtProvider, never()).validateToken(any());
    }

    @Test
    void filter_nonBearerHeader_delegatesToChain() {
        givenPath("/api/resource");
        givenAuthHeader("Basic dXNlcjpwYXNz");

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(jwtProvider, never()).validateToken(any());
    }

    // -----------------------------------------------------------------------
    // Invalid JWT
    // -----------------------------------------------------------------------

    @Test
    void filter_invalidBearerToken_returns401() {
        givenPath("/api/resource");
        givenAuthHeader("Bearer bad-token");
        when(jwtProvider.validateToken("bad-token")).thenThrow(new JwtException("bad"));
        when(response.setStatusCode(HttpStatus.UNAUTHORIZED)).thenReturn(true);
        when(response.setComplete()).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(response).setStatusCode(HttpStatus.UNAUTHORIZED);
        verify(chain, never()).filter(any());
    }
}
