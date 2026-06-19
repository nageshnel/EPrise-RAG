package com.v76.gems.gateway.security;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class ApiKeyAuthenticationFilter implements WebFilter {
    private final GatewaySecurityProperties properties;

    public ApiKeyAuthenticationFilter(GatewaySecurityProperties properties) {
        this.properties = properties;
    }

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Skip for auth endpoints and health checks
        if (path.startsWith("/auth/") || path.startsWith("/actuator/health")) {
            return chain.filter(exchange);
        }

        // Skip if a JWT Bearer token is present — let JwtAuthenticationFilter handle it
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return chain.filter(exchange);
        }

        // Validate API key
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
            return java.util.Objects.requireNonNull(exchange.getResponse().setComplete());
        }

        String suppliedKey = exchange.getRequest().getHeaders().getFirst(java.util.Objects.requireNonNull(properties.apiKeyHeader()));
        if (!properties.apiKey().equals(suppliedKey)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return java.util.Objects.requireNonNull(exchange.getResponse().setComplete());
        }

        // Set security context for a valid API key
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        "api-key-user",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_API_CLIENT"))
                );
        return java.util.Objects.requireNonNull(chain.filter(exchange)
                .contextWrite(ReactiveSecurityContextHolder.withAuthentication(authentication)));
    }
}

