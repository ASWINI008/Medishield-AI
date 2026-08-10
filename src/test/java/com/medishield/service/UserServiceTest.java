package com.medishield.service;

import com.medishield.dto.RegisterRequest;
import com.medishield.model.User;
import com.medishield.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private RegisterRequest validRequest;

    @BeforeEach
    public void setUp() {
        validRequest = new RegisterRequest("Aswin", "aswin@example.com", "securePass123", "patient", "1234567890");
    }

    @Test
    public void testRegisterUser_Success() {
        User userToSave = User.builder()
                .name(validRequest.getName())
                .email(validRequest.getEmail())
                .password(validRequest.getPassword())
                .role("patient")
                .phone(validRequest.getPhone())
                .build();

        when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(userToSave);

        User registered = userService.registerUser(validRequest);

        assertNotNull(registered);
        assertEquals(validRequest.getEmail(), registered.getEmail());
        verify(userRepository, times(1)).findByEmail(validRequest.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegisterUser_DuplicateEmail_ThrowsException() {
        when(userRepository.findByEmail(validRequest.getEmail())).thenReturn(Optional.of(new User()));

        assertThrows(IllegalStateException.class, () -> userService.registerUser(validRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testRegisterUser_NullRequest_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(null));
    }

    @Test
    public void testRegisterUser_EmptyEmail_ThrowsException() {
        validRequest.setEmail("");
        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(validRequest));
    }

    @Test
    public void testRegisterUser_InvalidEmailFormat_ThrowsException() {
        validRequest.setEmail("invalidemail.com");
        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(validRequest));
    }

    @Test
    public void testRegisterUser_ShortPassword_ThrowsException() {
        validRequest.setPassword("123");
        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(validRequest));
    }

    @Test
    public void testRegisterUser_InvalidRole_ThrowsException() {
        validRequest.setRole("superadmin");
        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(validRequest));
    }

    @Test
    public void testGetUserById_Success() {
        User user = User.builder().id(1).name("Aswin").email("aswin@example.com").build();
        when(userRepository.findById(1)).thenReturn(Optional.of(user));

        User found = userService.getUserById(1);

        assertNotNull(found);
        assertEquals(1, found.getId());
        verify(userRepository, times(1)).findById(1);
    }

    @Test
    public void testGetUserById_NotFound_ThrowsException() {
        when(userRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.getUserById(99));
    }

    @Test
    public void testGetUserById_NullId_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> userService.getUserById(null));
    }

    @Test
    public void testUpdateUserProfile_Success() {
        User existing = User.builder().id(1).name("Old Name").phone("111").build();
        User updatedData = User.builder().name("New Name").phone("222").bloodGroup("O+").address("Address 1").dateOfBirth(LocalDate.of(2000, 1, 1)).build();

        when(userRepository.findById(1)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        User updated = userService.updateUserProfile(1, updatedData);

        assertNotNull(updated);
        assertEquals("New Name", updated.getName());
        assertEquals("222", updated.getPhone());
        assertEquals("O+", updated.getBloodGroup());
        assertEquals("Address 1", updated.getAddress());
        assertEquals(LocalDate.of(2000, 1, 1), updated.getDateOfBirth());
        
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals("New Name", captor.getValue().getName());
    }

    @Test
    public void testAssignCaregiver_Success() {
        User patient = User.builder().id(1).name("Patient").role("patient").build();
        User caregiver = User.builder().id(2).name("Caregiver").role("caregiver").build();

        when(userRepository.findById(1)).thenReturn(Optional.of(patient));
        when(userRepository.findById(2)).thenReturn(Optional.of(caregiver));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArguments()[0]);

        User updatedPatient = userService.assignCaregiver(1, 2);

        assertNotNull(updatedPatient);
        assertEquals(2, updatedPatient.getCaregiverId());
        verify(userRepository, times(1)).save(patient);
    }

    @Test
    public void testAssignCaregiver_NotCaregiverRole_ThrowsException() {
        User patient = User.builder().id(1).name("Patient").role("patient").build();
        User invalidCaregiver = User.builder().id(2).name("FakeCaregiver").role("patient").build();

        when(userRepository.findById(1)).thenReturn(Optional.of(patient));
        when(userRepository.findById(2)).thenReturn(Optional.of(invalidCaregiver));

        assertThrows(IllegalArgumentException.class, () -> userService.assignCaregiver(1, 2));
    }

    @Test
    public void testGetPatientsForCaregiver_Success() {
        User p1 = User.builder().id(2).name("P1").caregiverId(1).build();
        User p2 = User.builder().id(3).name("P2").caregiverId(1).build();
        when(userRepository.findByCaregiverId(1)).thenReturn(Arrays.asList(p1, p2));

        List<User> list = userService.getPatientsForCaregiver(1);
        assertEquals(2, list.size());
    }
}
