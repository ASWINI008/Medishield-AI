package com.medishield.service;

import com.medishield.dto.ChangePasswordRequest;
import com.medishield.model.User;
import com.medishield.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User getProfile(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found for ID: " + userId));
    }

    @Transactional
    public User updateProfile(Integer userId, User updatedDetails) {
        if (userId == null || updatedDetails == null) {
            throw new IllegalArgumentException("Invalid profile details");
        }
        User existing = getProfile(userId);
        
        if (updatedDetails.getName() != null && !updatedDetails.getName().trim().isEmpty()) {
            existing.setName(updatedDetails.getName());
        }
        if (updatedDetails.getPhone() != null) {
            existing.setPhone(updatedDetails.getPhone());
        }
        if (updatedDetails.getAddress() != null) {
            existing.setAddress(updatedDetails.getAddress());
        }
        if (updatedDetails.getBloodGroup() != null) {
            existing.setBloodGroup(updatedDetails.getBloodGroup());
        }
        if (updatedDetails.getDateOfBirth() != null) {
            existing.setDateOfBirth(updatedDetails.getDateOfBirth());
        }

        return userRepository.save(existing);
    }

    @Transactional
    public boolean changePassword(Integer userId, ChangePasswordRequest request) {
        if (userId == null || request == null) {
            throw new IllegalArgumentException("Password change request cannot be empty");
        }
        if (request.getOldPassword() == null || request.getNewPassword() == null) {
            throw new IllegalArgumentException("Passwords cannot be null");
        }
        if (request.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long");
        }
        if (request.getOldPassword().equals(request.getNewPassword())) {
            throw new IllegalArgumentException("New password cannot be same as old password");
        }

        User user = getProfile(userId);

        boolean matches = passwordEncoder.matches(request.getOldPassword(), user.getPassword()) 
                || request.getOldPassword().equals(user.getPassword());

        if (!matches) {
            throw new IllegalArgumentException("Incorrect current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return true;
    }
}
