package com.medishield.controller;

import com.medishield.dto.ChatRequest;
import com.medishield.dto.ChatResponse;
import com.medishield.model.ChatHistory;
import com.medishield.model.User;
import com.medishield.service.AIService;
import com.medishield.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @Autowired
    private UserService userService;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.getAllUsers().stream()
                .filter(u -> u.getEmail().equals(email))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        User user = getCurrentUser();
        ChatResponse response = aiService.chat(user.getId(), request.getMessage());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/public-chat")
    public ResponseEntity<ChatResponse> publicChat(@RequestBody ChatRequest request) {
        ChatResponse response = aiService.publicChat(request.getMessage());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/scan")
    public ResponseEntity<ChatResponse> scanPrescription(@RequestBody Map<String, String> body) {
        User user = getCurrentUser();
        String base64Image = body.getOrDefault("image", "");
        ChatResponse response = aiService.scanPrescription(user.getId(), base64Image);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<ChatHistory> getChatHistory() {
        User user = getCurrentUser();
        ChatHistory history = aiService.getChatHistory(user.getId());
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> clearChatHistory() {
        User user = getCurrentUser();
        aiService.clearChatHistory(user.getId());
        return ResponseEntity.ok(Map.of("success", true, "message", "Chat history cleared successfully"));
    }
}
