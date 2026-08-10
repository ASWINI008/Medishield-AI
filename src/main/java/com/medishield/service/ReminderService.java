package com.medishield.service;

import com.medishield.model.Medicine;
import com.medishield.model.Notification;
import com.medishield.repository.MedicineRepository;
import com.medishield.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReminderService {

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Medicine> checkRemindersForPatient(Integer patientId) {
        if (patientId == null) {
            throw new IllegalArgumentException("Patient ID cannot be null");
        }
        List<Medicine> activeMedicines = medicineRepository.findByPatientIdAndIsActive(patientId, true);
        List<Medicine> reminderList = new ArrayList<>();

        for (Medicine med : activeMedicines) {
            // Business rule: If stock is low, add notification alert
            if (med.getStock() != null && med.getStock() <= med.getRefillAt()) {
                Notification refillNotif = Notification.builder()
                        .recipientId(patientId)
                        .title("Refill Reminder: " + med.getName())
                        .message("Stock is low (" + med.getStock() + " remaining). Please refill soon.")
                        .type("refill")
                        .isRead(false)
                        .relatedMedicineId(med.getId())
                        .build();
                notificationRepository.save(refillNotif);
            }
            reminderList.add(med);
        }
        return reminderList;
    }

    public boolean triggerEmergencySOS(Integer patientId, String message) {
        if (patientId == null || message == null || message.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid emergency request parameters");
        }
        
        // Log emergency alert simulation
        Notification sosNotif = Notification.builder()
                .recipientId(patientId)
                .title("EMERGENCY SOS ALERT")
                .message(message)
                .type("emergency")
                .isRead(false)
                .build();
        notificationRepository.save(sosNotif);
        return true;
    }
}
