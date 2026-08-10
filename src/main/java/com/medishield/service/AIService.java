package com.medishield.service;

import com.medishield.dto.ChatResponse;
import com.medishield.model.ChatHistory;
import com.medishield.repository.ChatHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class AIService {

    @Autowired
    private ChatHistoryRepository chatHistoryRepository;

    @Transactional
    public ChatResponse chat(Integer userId, String message) {
        if (userId == null || message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("User ID and message cannot be empty");
        }

        // Mock response generation (representing Google Gemini model interaction)
        String aiResponse = "As your MediShield AI assistant, I recommend keeping track of your dosage. For message: '" 
                + message + "', make sure you take it with water.";

        // Retrieve and append to chat history
        ChatHistory history = chatHistoryRepository.findByUserId(userId)
                .orElse(ChatHistory.builder().userId(userId).messages("[]").build());

        String currentMsgJson = history.getMessages();
        String formattedMsg = "{\"sender\":\"user\",\"text\":\"" + message.replace("\"", "\\\"") + "\"}," +
                             "{\"sender\":\"ai\",\"text\":\"" + aiResponse.replace("\"", "\\\"") + "\"}";
        
        if (currentMsgJson == null || currentMsgJson.equals("[]") || currentMsgJson.isEmpty()) {
            history.setMessages("[" + formattedMsg + "]");
        } else {
            history.setMessages(currentMsgJson.substring(0, currentMsgJson.length() - 1) + "," + formattedMsg + "]");
        }

        chatHistoryRepository.save(history);
        return new ChatResponse(true, aiResponse);
    }

    public ChatResponse publicChat(String message) {
        if (message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }
        return new ChatResponse(true, "MediShield Public AI assistant response: Please login for personalized assistance.");
    }

    @Transactional
    public ChatResponse scanPrescription(Integer userId, String base64Image) {
        if (userId == null || base64Image == null || base64Image.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid scan request details");
        }
        
        // Mock OCR scanner extraction
        String parsedOutput = "Extracted Medicine: Paracetamol, Dosage: 500mg, Frequency: twice daily.";
        chat(userId, "System prescription scan requested.");
        return new ChatResponse(true, parsedOutput);
    }

    public ChatHistory getChatHistory(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        return chatHistoryRepository.findByUserId(userId)
                .orElse(ChatHistory.builder().userId(userId).messages("[]").build());
    }

    @Transactional
    public void clearChatHistory(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        Optional<ChatHistory> historyOpt = chatHistoryRepository.findByUserId(userId);
        if (historyOpt.isPresent()) {
            ChatHistory history = historyOpt.get();
            history.setMessages("[]");
            chatHistoryRepository.save(history);
        }
    }
}
