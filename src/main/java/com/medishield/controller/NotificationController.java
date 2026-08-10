package com.medishield.controller;

import com.medishield.model.Notification;
import com.medishield.model.User;
import com.medishield.service.NotificationService;
import com.medishield.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

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
    public ResponseEntity<List<Notification>> getNotifications() {
        User user = getCurrentUser();
        List<Notification> list = notificationService.getNotificationsForUser(user.getId());
        return ResponseEntity.ok(list);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable Integer id) {
        User user = getCurrentUser();
        Notification updated = notificationService.markNotificationAsRead(user.getId(), id);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllRead() {
        User user = getCurrentUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().body(Map.of("success", true, "message", "All notifications marked as read"));
    }
}
