package com.medishield.controller;

import com.medishield.dto.ChangePasswordRequest;
import com.medishield.model.User;
import com.medishield.service.ProfileService;
import com.medishield.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private ProfileService profileService;

    @Autowired
    private UserService userService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getAllUsers().stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile() {
        User user = getCurrentUser();
        User profile = profileService.getProfile(user.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody User profileData) {
        User user = getCurrentUser();
        User updated = profileService.updateProfile(user.getId(), profileData);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        User user = getCurrentUser();
        boolean success = profileService.changePassword(user.getId(), request);
        return ResponseEntity.ok().body(Map.of("success", success, "message", "Password changed successfully"));
    }
}
