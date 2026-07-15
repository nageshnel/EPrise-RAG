package com.v76.eprise.gateway.auth;

import com.v76.eprise.gateway.security.JwtProvider;
import com.v76.eprise.gateway.user.AppUser;
import com.v76.eprise.gateway.user.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

        @Mock
        AppUserRepository userRepository;
        @Mock
        PasswordEncoder passwordEncoder;
        @Mock
        JwtProvider jwtProvider;

        @InjectMocks
        AuthController authController;

        private AppUser enabledUser;

        @BeforeEach
        void setUp() {
                enabledUser = new AppUser("alice", "hashed-pw", "USER");
                enabledUser.setId(UUID.randomUUID());
                enabledUser.setEnabled(true);
        }

        // -----------------------------------------------------------------------
        // login
        // -----------------------------------------------------------------------

        @Test
        void login_validCredentials_returnsAuthResponse() {
                when(userRepository.findByUsername("alice")).thenReturn(Mono.just(enabledUser));
                when(passwordEncoder.matches("secret", "hashed-pw")).thenReturn(true);
                lenient().when(jwtProvider.generateToken(enabledUser.getId(), "alice", "USER")).thenReturn("jwt-token");
                when(jwtProvider.getExpirationMs()).thenReturn(3_600_000L);

                LoginRequest request = new LoginRequest("alice", "secret");

                StepVerifier.create(authController.login(request))
                                .assertNext(response -> {
                                        assertThat(response.token()).isEqualTo("jwt-token");
                                        assertThat(response.expiresIn()).isEqualTo(3_600_000L);
                                })
                                .verifyComplete();
        }

        @Test
        void login_userNotFound_returnsUnauthorized() {
                when(userRepository.findByUsername("unknown")).thenReturn(Mono.empty());

                LoginRequest request = new LoginRequest("unknown", "secret");

                StepVerifier.create(authController.login(request))
                                .expectErrorSatisfies(ex -> {
                                        assertThat(ex).isInstanceOf(ResponseStatusException.class);
                                        assertThat(((ResponseStatusException) ex).getStatusCode())
                                                        .isEqualTo(HttpStatus.UNAUTHORIZED);
                                })
                                .verify();
        }

        @Test
        void login_disabledUser_returnsUnauthorized() {
                enabledUser.setEnabled(false);
                when(userRepository.findByUsername("alice")).thenReturn(Mono.just(enabledUser));

                LoginRequest request = new LoginRequest("alice", "secret");

                StepVerifier.create(authController.login(request))
                                .expectErrorMatches(ex -> ex instanceof ResponseStatusException rse
                                                && rse.getStatusCode() == HttpStatus.UNAUTHORIZED)
                                .verify();
        }

        @Test
        void login_wrongPassword_returnsUnauthorized() {
                when(userRepository.findByUsername("alice")).thenReturn(Mono.just(enabledUser));
                when(passwordEncoder.matches("wrong", "hashed-pw")).thenReturn(false);

                LoginRequest request = new LoginRequest("alice", "wrong");

                StepVerifier.create(authController.login(request))
                                .expectErrorMatches(ex -> ex instanceof ResponseStatusException rse
                                                && rse.getStatusCode() == HttpStatus.UNAUTHORIZED)
                                .verify();
        }

        // -----------------------------------------------------------------------
        // register
        // -----------------------------------------------------------------------

        @Test
        void register_newUser_savesAndReturnsResponse() {
                when(userRepository.findByUsername("newuser")).thenReturn(Mono.empty());
                when(passwordEncoder.encode("pass")).thenReturn("enc-pass");

                AppUser saved = new AppUser("newuser", "enc-pass", "USER");
                saved.setId(UUID.randomUUID());
                when(userRepository.save(any(AppUser.class))).thenReturn(Mono.just(saved));

                LoginRequest request = new LoginRequest("newuser", "pass");

                StepVerifier.create(authController.register(request))
                                .assertNext(response -> {
                                        assertThat(response.username()).isEqualTo("newuser");
                                        assertThat(response.id()).isEqualTo(saved.getId());
                                })
                                .verifyComplete();
        }

        @Test
        void register_existingUsername_returnsConflict() {
                when(userRepository.findByUsername("alice")).thenReturn(Mono.just(enabledUser));

                LoginRequest request = new LoginRequest("alice", "anypass");

                StepVerifier.create(authController.register(request))
                                .expectErrorMatches(ex -> ex instanceof ResponseStatusException rse
                                                && rse.getStatusCode() == HttpStatus.CONFLICT)
                                .verify();
        }
}
