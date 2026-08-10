package com.medishield.service;

import com.medishield.model.Medicine;
import com.medishield.model.Notification;
import com.medishield.repository.MedicineRepository;
import com.medishield.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Arrays;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReminderServiceTest {

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private ReminderService reminderService;

    @Test
    public void testCheckRemindersForPatient_LowStockTriggersNotification() {
        Medicine med = Medicine.builder()
                .id(1)
                .patientId(10)
                .name("Paracetamol")
                .stock(2) // Stock below refill limit (5)
                .refillAt(5)
                .isActive(true)
                .build();

        when(medicineRepository.findByPatientIdAndIsActive(10, true)).thenReturn(Arrays.asList(med));
        when(notificationRepository.save(any(Notification.class))).thenReturn(new Notification());

        List<Medicine> result = reminderService.checkRemindersForPatient(10);

        assertEquals(1, result.size());
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    public void testTriggerEmergencySOS_Success() {
        when(notificationRepository.save(any(Notification.class))).thenReturn(new Notification());

        boolean result = reminderService.triggerEmergencySOS(10, "Help, I missed my heart meds!");

        assertTrue(result);
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    public void testTriggerEmergencySOS_InvalidMessage_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> reminderService.triggerEmergencySOS(10, ""));
    }
}
