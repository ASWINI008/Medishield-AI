package com.medishield.controller;

import com.medishield.model.User;
import com.medishield.service.DashboardService;
import com.medishield.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/caregiver")
@PreAuthorize("hasRole('CAREGIVER') or hasRole('ADMIN')")
public class CaregiverController {

    @Autowired
    private UserService userService;

    @Autowired
    private DashboardService dashboardService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getAllUsers().stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping("/patients")
    public ResponseEntity<List<User>> getAssignedPatients() {
        User caregiver = getCurrentUser();
        List<User> patients = userService.getPatientsForCaregiver(caregiver.getId());
        return ResponseEntity.ok(patients);
    }

    @PostMapping("/assign-patient")
    public ResponseEntity<?> assignPatient(@RequestBody Map<String, Integer> body) {
        User caregiver = getCurrentUser();
        Integer patientId = body.get("patientId");
        User updatedPatient = userService.assignCaregiver(patientId, caregiver.getId());
        return ResponseEntity.ok(updatedPatient);
    }

    @GetMapping("/patient/{patientId}/summary")
    public ResponseEntity<?> getPatientSummary(@PathVariable Integer patientId) {
        // Validate patient is assigned to this caregiver
        User caregiver = getCurrentUser();
        User patient = userService.getUserById(patientId);
        if (!caregiver.getId().equals(patient.getCaregiverId())) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Unauthorized access to patient data"));
        }

        Map<String, Object> analytics = dashboardService.getDashboardAnalytics(patientId);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/insights/{patientId}")
    public ResponseEntity<?> getPatientInsights(@PathVariable Integer patientId) {
        User caregiver = getCurrentUser();
        User patient = userService.getUserById(patientId);
        if (!caregiver.getId().equals(patient.getCaregiverId())) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Unauthorized access to patient insights"));
        }

        // Return a mock AI generated care insight
        String insights = "Patient " + patient.getName() + " is showing 95% compliance rate this week. High stock levels are healthy.";
        return ResponseEntity.ok(Map.of("success", true, "insights", insights));
    }
}
