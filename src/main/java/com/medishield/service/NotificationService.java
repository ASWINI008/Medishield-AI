package com.medishield.service;

import com.medishield.model.Notification;
import com.medishield.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getNotificationsForUser(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        return notificationRepository.findByRecipientId(userId);
    }

    @Transactional
    public Notification markNotificationAsRead(Integer userId, Integer notificationId) {
        if (userId == null || notificationId == null) {
            throw new IllegalArgumentException("IDs cannot be null");
        }
        Notification notif = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + notificationId));

        if (!notif.getRecipientId().equals(userId)) {
            throw new IllegalStateException("Unauthorized user for notification update");
        }

        notif.setIsRead(true);
        return notificationRepository.save(notif);
    }

    @Transactional
    public void markAllAsRead(Integer userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsRead(userId, false);
        for (Notification n : unread) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public Notification createNotification(Notification notif) {
        if (notif == null || notif.getRecipientId() == null || notif.getTitle() == null || notif.getMessage() == null) {
            throw new IllegalArgumentException("Notification field validation failed");
        }
        return notificationRepository.save(notif);
    }
}
