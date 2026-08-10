package com.medishield.controller;

import com.medishield.model.User;
import com.medishield.service.ReminderService;
import com.medishield.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyController {

    @Autowired
    private ReminderService reminderService;

    @Autowired
    private UserService userService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getAllUsers().stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @PostMapping("/sos")
    public ResponseEntity<?> triggerSOS(@RequestBody Map<String, String> body) {
        User patient = getCurrentUser();
        String message = body.getOrDefault("message", "Emergency panic button pressed. Immediate assistance required!");
        boolean success = reminderService.triggerEmergencySOS(patient.getId(), message);
        return ResponseEntity.ok(Map.of("success", success, "message", "SOS alerts triggered and caregiver notified."));
    }
}
