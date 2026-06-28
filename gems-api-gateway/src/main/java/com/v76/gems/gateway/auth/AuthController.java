package com.v76.gems.gateway.auth;

import com.v76.gems.gateway.security.JwtProvider;
import com.v76.gems.gateway.user.AppUser;
import com.v76.gems.gateway.user.AppUserRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public AuthController(AppUserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtProvider jwtProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
    }

    @PostMapping("/login")
    public Mono<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Processing login request for user: {}", request.username());
        return userRepository.findByUsername(request.username())
                .filter(user -> user.isEnabled()
                        && passwordEncoder.matches(request.password(), user.getPassword()))
                .map(user -> {
                    log.info("Login successful for user: {}", request.username());
                    return new AuthResponse(
                            jwtProvider.generateToken(user.getUsername(), user.getRole()),
                            jwtProvider.getExpirationMs());
                })
                .switchIfEmpty(Mono.defer(() -> {
                    log.warn("Login failed for user: {}", request.username());
                    return Mono.error(
                            new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
                }));
    }

    @PostMapping("/register")
    public Mono<RegisterResponse> register(@Valid @RequestBody LoginRequest request) {
        log.info("Processing registration request for user: {}", request.username());
        return userRepository.findByUsername(request.username())
                .flatMap(existing -> {
                    log.warn("Registration failed: Username {} already exists", request.username());
                    return Mono.<RegisterResponse>error(
                            new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists"));
                })
                .switchIfEmpty(Mono.defer(() -> {
                    log.info("Creating new user: {}", request.username());
                    AppUser user = new AppUser(
                            request.username(),
                            passwordEncoder.encode(request.password()),
                            "USER"
                    );
                    return userRepository.save(user)
                            .map(saved -> {
                                log.info("Successfully registered user: {}, ID: {}", saved.getUsername(), saved.getId());
                                return new RegisterResponse(saved.getId(), saved.getUsername());
                            });
                }));
    }
}
