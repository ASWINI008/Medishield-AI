package com.medishield.controller;

import com.medishield.model.Medicine;
import com.medishield.model.User;
import com.medishield.service.MedicineService;
import com.medishield.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    @Autowired
    private MedicineService medicineService;

    @Autowired
    private UserService userService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getAllUsers().stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping
    public ResponseEntity<List<Medicine>> getMedicines() {
        User user = getCurrentUser();
        List<Medicine> medicines = medicineService.getMedicinesByPatient(user.getId());
        return ResponseEntity.ok(medicines);
    }

    @PostMapping
    public ResponseEntity<Medicine> createMedicine(@RequestBody Medicine medicine) {
        User user = getCurrentUser();
        Medicine created = medicineService.createMedicine(user.getId(), medicine);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Integer id, @RequestBody Medicine medicineData) {
        User user = getCurrentUser();
        Medicine updated = medicineService.updateMedicine(user.getId(), id, medicineData);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMedicine(@PathVariable Integer id) {
        User user = getCurrentUser();
        medicineService.deleteMedicine(user.getId(), id);
        return ResponseEntity.ok().body(Map.of("success", true, "message", "Medicine deleted successfully"));
    }

    @PostMapping("/{id}/take")
    public ResponseEntity<Medicine> takeMedicine(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        User user = getCurrentUser();
        String dateStr = body.getOrDefault("date", java.time.LocalDate.now().toString());
        Medicine updated = medicineService.takeMedicine(user.getId(), id, dateStr);
        return ResponseEntity.ok(updated);
    }
}
