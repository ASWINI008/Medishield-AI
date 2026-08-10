package com.medishield.service;

import com.medishield.dto.ChangePasswordRequest;
import com.medishield.model.User;
import com.medishield.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProfileService profileService;

    private User sampleUser;

    @BeforeEach
    public void setUp() {
        sampleUser = User.builder()
                .id(1)
                .name("Aswin")
                .email("aswin@example.com")
                .password("plainOldPassword123") // plain text configuration for test matching simplicity
                .build();
    }

    @Test
    public void testGetProfile_Success() {
        when(userRepository.findById(1)).thenReturn(Optional.of(sampleUser));

        User profile = profileService.getProfile(1);

        assertNotNull(profile);
        assertEquals("Aswin", profile.getName());
    }

    @Test
    public void testUpdateProfile_Success() {
        User details = User.builder().name("Aswin Nair").phone("9876543210").build();
        when(userRepository.findById(1)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        User updated = profileService.updateProfile(1, details);

        assertNotNull(updated);
        assertEquals("Aswin Nair", updated.getName());
        assertEquals("9876543210", updated.getPhone());
    }

    @Test
    public void testChangePassword_Success() {
        ChangePasswordRequest request = new ChangePasswordRequest("plainOldPassword123", "brandNewPassword321");
        when(userRepository.findById(1)).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        boolean result = profileService.changePassword(1, request);

        assertTrue(result);
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    public void testChangePassword_ShortPassword_ThrowsException() {
        ChangePasswordRequest request = new ChangePasswordRequest("plainOldPassword123", "short");
        assertThrows(IllegalArgumentException.class, () -> profileService.changePassword(1, request));
    }

    @Test
    public void testChangePassword_SamePasswords_ThrowsException() {
        ChangePasswordRequest request = new ChangePasswordRequest("plainOldPassword123", "plainOldPassword123");
        assertThrows(IllegalArgumentException.class, () -> profileService.changePassword(1, request));
    }

    @Test
    public void testChangePassword_WrongOldPassword_ThrowsException() {
        ChangePasswordRequest request = new ChangePasswordRequest("wrongOldPassword", "brandNewPassword321");
        when(userRepository.findById(1)).thenReturn(Optional.of(sampleUser));

        assertThrows(IllegalArgumentException.class, () -> profileService.changePassword(1, request));
    }
}
