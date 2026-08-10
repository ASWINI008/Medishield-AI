package com.medishield.service;

import com.medishield.dto.ChatResponse;
import com.medishield.model.ChatHistory;
import com.medishield.repository.ChatHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AIServiceTest {

    @Mock
    private ChatHistoryRepository chatHistoryRepository;

    @InjectMocks
    private AIService aiService;

    @Test
    public void testChat_AppendsToHistory() {
        ChatHistory existingHistory = ChatHistory.builder().userId(1).messages("[]").build();
        when(chatHistoryRepository.findByUserId(1)).thenReturn(Optional.of(existingHistory));
        when(chatHistoryRepository.save(any(ChatHistory.class))).thenAnswer(i -> i.getArguments()[0]);

        ChatResponse response = aiService.chat(1, "What is Paracetamol?");

        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertTrue(response.getResponse().contains("Paracetamol"));
        
        // Assert logs saved to history
        verify(chatHistoryRepository, times(1)).save(existingHistory);
        assertTrue(existingHistory.getMessages().contains("What is Paracetamol?"));
    }

    @Test
    public void testPublicChat_Success() {
        ChatResponse response = aiService.publicChat("Hello chatbot");
        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertTrue(response.getResponse().contains("login"));
    }

    @Test
    public void testScanPrescription_OCRSuccess() {
        when(chatHistoryRepository.findByUserId(1)).thenReturn(Optional.empty());
        when(chatHistoryRepository.save(any(ChatHistory.class))).thenReturn(new ChatHistory());

        ChatResponse response = aiService.scanPrescription(1, "base64EncodedImageStringHere");

        assertNotNull(response);
        assertTrue(response.getSuccess());
        assertTrue(response.getResponse().contains("Paracetamol"));
    }

    @Test
    public void testClearChatHistory_Success() {
        ChatHistory history = ChatHistory.builder().userId(1).messages("[{\"sender\":\"user\"}]").build();
        when(chatHistoryRepository.findByUserId(1)).thenReturn(Optional.of(history));
        when(chatHistoryRepository.save(any(ChatHistory.class))).thenAnswer(i -> i.getArguments()[0]);

        aiService.clearChatHistory(1);

        assertEquals("[]", history.getMessages());
        verify(chatHistoryRepository, times(1)).save(history);
    }
}
