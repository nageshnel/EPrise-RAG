package com.v76.eprise.gateway.security;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@Order(-190)
public class ApiKeyAuthenticationFilter implements WebFilter {
    private static final Logger log = LoggerFactory.getLogger(ApiKeyAuthenticationFilter.class);
    private final GatewaySecurityProperties properties;

    public ApiKeyAuthenticationFilter(GatewaySecurityProperties properties) {
        this.properties = properties;
    }

    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        // Skip CORS preflight OPTIONS requests
        if (org.springframework.http.HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }

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
            log.error("API Key security is not configured or blank in gateway properties");
            exchange.getResponse().setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
            return java.util.Objects.requireNonNull(exchange.getResponse().setComplete());
        }

        String apiKeyHeaderName = properties.apiKeyHeader();
        String suppliedKey = exchange.getRequest().getHeaders().getFirst(java.util.Objects.requireNonNull(apiKeyHeaderName));
        if (!properties.apiKey().equals(suppliedKey)) {
            log.warn("API Key validation failed for path: {} (Header: {}, Supplied: {})", path, apiKeyHeaderName, suppliedKey != null ? "PRESENT" : "MISSING");
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return java.util.Objects.requireNonNull(exchange.getResponse().setComplete());
        }

        log.debug("API Key validation successful for path: {}", path);

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

