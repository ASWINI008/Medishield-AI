package com.medishield.controller;

import com.medishield.dto.AuthRequest;
import com.medishield.dto.AuthResponse;
import com.medishield.dto.RegisterRequest;
import com.medishield.model.User;
import com.medishield.service.AuthenticationService;
import com.medishield.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationService authenticationService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        AuthResponse response = authenticationService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.getUserById(userService.registerUser(new RegisterRequest("", email, "dummyPassword123", "patient", "")).getId());
        // Alternatively, find by email
        User foundUser = userService.getAllUsers().stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        return ResponseEntity.ok(foundUser);
    }
}
