package com.medishield.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "medicines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private Integer patientId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String dosage;

    @Column(length = 20)
    private String frequency = "once";

    // Store as JSON string
    @Column(columnDefinition = "TEXT")
    private String timings = "[\"08:00\"]";

    @Column(columnDefinition = "TEXT")
    private String instructions = "";

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer stock = 30;

    private Integer refillAt = 5;

    @Column(length = 20)
    private String color = "#2563eb";

    // Store as JSON string
    @Column(columnDefinition = "TEXT")
    private String takenDates = "[]";

    // Store as JSON string
    @Column(columnDefinition = "TEXT")
    private String missedDates = "[]";

    private Boolean isActive = true;
}
