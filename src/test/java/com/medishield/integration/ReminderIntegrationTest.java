package com.medishield.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medishield.dto.AuthRequest;
import com.medishield.dto.RegisterRequest;
import com.medishield.model.Medicine;
import com.medishield.model.Notification;
import com.medishield.model.User;
import com.medishield.repository.MedicineRepository;
import com.medishield.repository.NotificationRepository;
import com.medishield.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ReminderIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private User testUser;

    @BeforeEach
    public void setUp() throws Exception {
        notificationRepository.deleteAll();
        medicineRepository.deleteAll();
        userRepository.deleteAll();

        // Register and login user to obtain token
        RegisterRequest reg = new RegisterRequest("Patient Z", "patientz@example.com", "password123", "patient", "123");
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andReturn();
        
        testUser = objectMapper.readValue(regResult.getResponse().getContentAsString(), User.class);

        AuthRequest log = new AuthRequest("patientz@example.com", "password123");
        MvcResult logResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(log)))
                .andReturn();

        Map<?, ?> responseMap = objectMapper.readValue(logResult.getResponse().getContentAsString(), Map.class);
        jwtToken = (String) responseMap.get("token");
    }

    @Test
    public void testLowStockAlertTriggerFlow() throws Exception {
        // Create medicine with low stock (2), refill limit (5)
        Medicine med = Medicine.builder()
                .name("Adrenaline")
                .dosage("0.3mg")
                .stock(2)
                .refillAt(5)
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/medicines")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(med)))
                .andExpect(status().isOk());

        // Perform take medicine, which triggers stock checks / notifications
        mockMvc.perform(post("/api/emergency/sos")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"SOS! Heart condition emergency.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Retrieve notifications list
        mockMvc.perform(get("/api/notifications")
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].type", is("emergency")))
                .andExpect(jsonPath("$[0].message", containsString("SOS! Heart condition emergency.")));
    }
}
