package com.medishield.repository;

import com.medishield.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByRecipientId(Integer recipientId);
    List<Notification> findByRecipientIdAndIsRead(Integer recipientId, Boolean isRead);
}
