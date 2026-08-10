package com.medishield.service;

import com.medishield.dto.AuthRequest;
import com.medishield.dto.AuthResponse;
import com.medishield.model.User;
import com.medishield.repository.UserRepository;
import com.medishield.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthenticationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthenticationService authenticationService;

    private AuthRequest authRequest;
    private User testUser;

    @BeforeEach
    public void setUp() {
        authRequest = new AuthRequest("test@example.com", "pass123");
        testUser = User.builder()
                .id(1)
                .name("Test User")
                .email("test@example.com")
                .password("pass123") // plain text matching for simplify tests, mock helper manages BCrypt
                .role("patient")
                .loginAttempts(0)
                .build();
    }

    @Test
    public void testLogin_Success() {
        when(userRepository.findByEmail(authRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(jwtUtils.generateToken(testUser.getEmail(), testUser.getRole())).thenReturn("mockToken123");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        AuthResponse response = authenticationService.login(authRequest);

        assertNotNull(response);
        assertEquals("mockToken123", response.getToken());
        assertEquals(0, response.getUser().getLoginAttempts());
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    public void testLogin_IncorrectPassword_IncrementsAttempts() {
        authRequest.setPassword("wrongpassword");
        when(userRepository.findByEmail(authRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        assertThrows(BadCredentialsException.class, () -> authenticationService.login(authRequest));
        assertEquals(1, testUser.getLoginAttempts());
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    public void testLogin_ThreeFailedAttempts_LocksAccount() {
        testUser.setLoginAttempts(2);
        authRequest.setPassword("wrongpassword");
        when(userRepository.findByEmail(authRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        assertThrows(BadCredentialsException.class, () -> authenticationService.login(authRequest));
        assertEquals(3, testUser.getLoginAttempts());
        assertNotNull(testUser.getLockUntil());
        assertTrue(testUser.getLockUntil().isAfter(LocalDateTime.now()));
    }

    @Test
    public void testLogin_LockedAccount_ThrowsException() {
        testUser.setLockUntil(LocalDateTime.now().plusMinutes(5));
        when(userRepository.findByEmail(authRequest.getEmail())).thenReturn(Optional.of(testUser));

        assertThrows(LockedException.class, () -> authenticationService.login(authRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testLogin_InvalidEmail_ThrowsException() {
        when(userRepository.findByEmail(authRequest.getEmail())).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> authenticationService.login(authRequest));
    }

    @Test
    public void testLogin_NullRequest_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> authenticationService.login(null));
    }
}
