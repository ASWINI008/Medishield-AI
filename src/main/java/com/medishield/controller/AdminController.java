package com.medishield.controller;

import com.medishield.dto.RegisterRequest;
import com.medishield.model.User;
import com.medishield.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private UserService userService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "User deleted successfully"));
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getSystemAnalytics() {
        List<User> users = userService.getAllUsers();
        long patients = users.stream().filter(u -> "patient".equals(u.getRole())).count();
        long caregivers = users.stream().filter(u -> "caregiver".equals(u.getRole())).count();
        long admins = users.stream().filter(u -> "admin".equals(u.getRole())).count();

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalUsers", users.size());
        metrics.put("patientsCount", patients);
        metrics.put("caregiversCount", caregivers);
        metrics.put("adminsCount", admins);
        metrics.put("systemHealth", "optimal");

        return ResponseEntity.ok(metrics);
    }
}
