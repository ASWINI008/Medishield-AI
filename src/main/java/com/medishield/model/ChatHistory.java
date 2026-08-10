package com.medishield.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private Integer userId;

    // Store message logs as JSON string
    @Column(columnDefinition = "TEXT")
    private String messages = "[]";
}
