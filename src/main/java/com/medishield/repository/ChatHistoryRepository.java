package com.medishield.repository;

import com.medishield.model.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ChatHistoryRepository extends JpaRepository<ChatHistory, Integer> {
    Optional<ChatHistory> findByUserId(Integer userId);
}
