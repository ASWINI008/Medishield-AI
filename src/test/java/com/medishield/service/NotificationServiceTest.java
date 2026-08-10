package com.medishield.service;

import com.medishield.model.Notification;
import com.medishield.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private Notification testNotification;

    @BeforeEach
    public void setUp() {
        testNotification = Notification.builder()
                .id(100)
                .recipientId(1)
                .title("Reminder Alert")
                .message("Take medicine now")
                .type("reminder")
                .isRead(false)
                .build();
    }

    @Test
    public void testGetNotificationsForUser_Success() {
        when(notificationRepository.findByRecipientId(1)).thenReturn(Arrays.asList(testNotification));

        List<Notification> list = notificationService.getNotificationsForUser(1);

        assertEquals(1, list.size());
        verify(notificationRepository, times(1)).findByRecipientId(1);
    }

    @Test
    public void testMarkNotificationAsRead_Success() {
        when(notificationRepository.findById(100)).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArguments()[0]);

        Notification updated = notificationService.markNotificationAsRead(1, 100);

        assertNotNull(updated);
        assertTrue(updated.getIsRead());
        verify(notificationRepository, times(1)).save(testNotification);
    }

    @Test
    public void testMarkNotificationAsRead_Unauthorized_ThrowsException() {
        when(notificationRepository.findById(100)).thenReturn(Optional.of(testNotification));

        assertThrows(IllegalStateException.class, () -> notificationService.markNotificationAsRead(9, 100));
    }

    @Test
    public void testMarkAllAsRead_Success() {
        Notification n1 = Notification.builder().recipientId(1).isRead(false).build();
        Notification n2 = Notification.builder().recipientId(1).isRead(false).build();

        when(notificationRepository.findByRecipientIdAndIsRead(1, false)).thenReturn(Arrays.asList(n1, n2));
        when(notificationRepository.saveAll(anyList())).thenAnswer(i -> i.getArguments()[0]);

        notificationService.markAllAsRead(1);

        assertTrue(n1.getIsRead());
        assertTrue(n2.getIsRead());
        verify(notificationRepository, times(1)).saveAll(anyList());
    }

    @Test
    public void testCreateNotification_InvalidInput_ThrowsException() {
        testNotification.setTitle(null);
        assertThrows(IllegalArgumentException.class, () -> notificationService.createNotification(testNotification));
    }
}
