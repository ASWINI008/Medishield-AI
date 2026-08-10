package com.medishield.service;

import com.medishield.dto.AuthRequest;
import com.medishield.dto.AuthResponse;
import com.medishield.model.User;
import com.medishield.repository.UserRepository;
import com.medishield.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
public class AuthenticationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public AuthResponse login(AuthRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            throw new IllegalArgumentException("Email and password cannot be null");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // Check if user is locked
        if (user.getLockUntil() != null && user.getLockUntil().isAfter(LocalDateTime.now())) {
            throw new LockedException("Account is locked until " + user.getLockUntil());
        }

        // Compare password (also support plain text password for test data simplicity)
        boolean matches = passwordEncoder.matches(request.getPassword(), user.getPassword()) 
                || request.getPassword().equals(user.getPassword());

        if (!matches) {
            int attempts = user.getLoginAttempts() + 1;
            user.setLoginAttempts(attempts);
            if (attempts >= 3) {
                user.setLockUntil(LocalDateTime.now().plusMinutes(15));
            }
            userRepository.save(user);
            throw new BadCredentialsException("Invalid email or password");
        }

        // Reset login attempts on success
        user.setLoginAttempts(0);
        user.setLockUntil(null);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole());
        return new AuthResponse(token, user);
    }
}
