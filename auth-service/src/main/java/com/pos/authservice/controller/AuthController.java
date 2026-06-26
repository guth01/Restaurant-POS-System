package com.pos.authservice.controller;

import com.pos.authservice.dto.AuthResponse;
import com.pos.authservice.dto.LoginRequest;
import com.pos.authservice.dto.RegisterRequest;
import com.pos.authservice.dto.UserResponse;
import com.pos.authservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Protected endpoint — proves the JwtFilter + SecurityConfig wiring works.
     * Call this with "Authorization: Bearer <token>" from the login/register response.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        String email = authentication.getName(); // JwtFilter sets this to the user's email
        return ResponseEntity.ok(authService.getCurrentUser(email));
    }
}
