package com.medishield.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 20)
    private String role = "patient";

    @Column(length = 255)
    private String avatar = "";

    @Column(length = 20)
    private String phone = "";

    private LocalDate dateOfBirth;

    @Column(length = 10)
    private String bloodGroup = "";

    @Lob
    private String address = "";

    private Integer caregiverId;

    private Integer loginAttempts = 0;

    private LocalDateTime lockUntil;

    private LocalDateTime lastLogin;

    private Boolean notifEmail = true;

    private Boolean notifPush = true;
}
