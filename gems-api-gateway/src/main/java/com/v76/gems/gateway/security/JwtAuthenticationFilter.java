package com.v76.gems.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@Order(-200)
public class JwtAuthenticationFilter implements WebFilter {
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;

    public JwtAuthenticationFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        // Skip CORS preflight OPTIONS requests
        if (org.springframework.http.HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest().getPath().value();

        // Skip authentication for auth endpoints and health checks
        if (path.startsWith("/auth/") || path.startsWith("/actuator/health")) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        // No Bearer token present — let the ApiKeyAuthenticationFilter handle it
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            log.debug("No Bearer token found in headers for request path: {}", path);
            return chain.filter(exchange);
        }

        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            Claims claims = jwtProvider.validateToken(token);
            String username = claims.getSubject();
            String role = claims.get("role", String.class);
            String userId = claims.get("userId", String.class);

            log.debug("JWT successfully validated for user: {}, ID: {}, role: {}", username, userId, role);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

            ServerWebExchange.Builder exchangeBuilder = exchange.mutate();
            var requestBuilder = exchange.getRequest().mutate()
                    .header("X-User-Username", username)
                    .header("X-User-Role", role);
            if (userId != null) {
                requestBuilder.header("X-User-Id", userId);
            }
            exchangeBuilder.request(requestBuilder.build());
            ServerWebExchange mutatedExchange = exchangeBuilder.build();

            return java.util.Objects.requireNonNull(chain.filter(mutatedExchange)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication)));
        } catch (JwtException e) {
            log.warn("JWT validation failed for path {} - error: {}", path, e.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return java.util.Objects.requireNonNull(exchange.getResponse().setComplete());
        }
    }
}
