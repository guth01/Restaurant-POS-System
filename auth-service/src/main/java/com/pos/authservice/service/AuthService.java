package com.pos.authservice.service;

import com.pos.authservice.dto.AuthResponse;
import com.pos.authservice.dto.LoginRequest;
import com.pos.authservice.dto.RegisterRequest;
import com.pos.authservice.dto.UserResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserResponse getCurrentUser(String email);
}
