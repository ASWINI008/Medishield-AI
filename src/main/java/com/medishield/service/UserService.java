package com.medishield.service;

import com.medishield.dto.RegisterRequest;
import com.medishield.model.User;
import com.medishield.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public User registerUser(RegisterRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Registration request cannot be null");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        if (!request.getEmail().contains("@")) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        
        String role = request.getRole() != null ? request.getRole().toLowerCase() : "patient";
        if (!role.equals("patient") && !role.equals("caregiver") && !role.equals("admin")) {
            throw new IllegalArgumentException("Invalid user role");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(request.getPassword()) // In a real app we hash it
                .role(role)
                .phone(request.getPhone())
                .loginAttempts(0)
                .notifEmail(true)
                .notifPush(true)
                .avatar("")
                .bloodGroup("")
                .address("")
                .build();

        return userRepository.save(user);
    }

    public User getUserById(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + id));
    }

    @Transactional
    public User updateUserProfile(Integer id, User profileData) {
        if (id == null || profileData == null) {
            throw new IllegalArgumentException("Invalid profile update request");
        }
        User existing = getUserById(id);
        
        if (profileData.getName() != null && !profileData.getName().trim().isEmpty()) {
            existing.setName(profileData.getName());
        }
        if (profileData.getPhone() != null) {
            existing.setPhone(profileData.getPhone());
        }
        if (profileData.getBloodGroup() != null) {
            existing.setBloodGroup(profileData.getBloodGroup());
        }
        if (profileData.getAddress() != null) {
            existing.setAddress(profileData.getAddress());
        }
        if (profileData.getDateOfBirth() != null) {
            existing.setDateOfBirth(profileData.getDateOfBirth());
        }
        if (profileData.getNotifEmail() != null) {
            existing.setNotifEmail(profileData.getNotifEmail());
        }
        if (profileData.getNotifPush() != null) {
            existing.setNotifPush(profileData.getNotifPush());
        }

        return userRepository.save(existing);
    }

    @Transactional
    public User assignCaregiver(Integer patientId, Integer caregiverId) {
        if (patientId == null || caregiverId == null) {
            throw new IllegalArgumentException("Patient ID and Caregiver ID cannot be null");
        }
        User patient = getUserById(patientId);
        User caregiver = getUserById(caregiverId);

        if (!"caregiver".equals(caregiver.getRole())) {
            throw new IllegalArgumentException("Assigned user must have caregiver role");
        }

        patient.setCaregiverId(caregiverId);
        return userRepository.save(patient);
    }

    public List<User> getPatientsForCaregiver(Integer caregiverId) {
        if (caregiverId == null) {
            throw new IllegalArgumentException("Caregiver ID cannot be null");
        }
        return userRepository.findByCaregiverId(caregiverId);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Integer id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }
}
