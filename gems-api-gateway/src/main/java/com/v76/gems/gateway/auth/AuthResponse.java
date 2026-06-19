package com.v76.gems.gateway.auth;

public record AuthResponse(String token, long expiresIn) {
}
