package com.medishield;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MediShieldApplication {
    public static void main(String[] args) {
        SpringApplication.run(MediShieldApplication.class, args);
    }
}
