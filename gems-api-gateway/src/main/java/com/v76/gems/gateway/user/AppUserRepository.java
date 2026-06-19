package com.v76.gems.gateway.user;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface AppUserRepository extends ReactiveCrudRepository<AppUser, UUID> {
    Mono<AppUser> findByUsername(String username);
}
