package com.v76.eprise.gateway.auth;

public record AuthResponse(String token, long expiresIn) {
}
