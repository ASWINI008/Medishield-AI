package com.medishield.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medishield.dto.AuthRequest;
import com.medishield.dto.RegisterRequest;
import com.medishield.model.Medicine;
import com.medishield.model.User;
import com.medishield.repository.MedicineRepository;
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
import java.time.LocalDate;
import java.util.Map;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class MedicineIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String jwtToken;
    private User testUser;

    @BeforeEach
    public void setUp() throws Exception {
        medicineRepository.deleteAll();
        userRepository.deleteAll();

        // Register and login user to obtain token
        RegisterRequest reg = new RegisterRequest("Patient X", "patientx@example.com", "password123", "patient", "123");
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reg)))
                .andReturn();
        
        testUser = objectMapper.readValue(regResult.getResponse().getContentAsString(), User.class);

        AuthRequest log = new AuthRequest("patientx@example.com", "password123");
        MvcResult logResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(log)))
                .andReturn();

        Map<?, ?> responseMap = objectMapper.readValue(logResult.getResponse().getContentAsString(), Map.class);
        jwtToken = (String) responseMap.get("token");
    }

    @Test
    public void testMedicineLifeCycle() throws Exception {
        // 1. Create Medicine
        Medicine med = Medicine.builder()
                .name("Metformin")
                .dosage("500mg")
                .frequency("twice")
                .timings("[\"08:00\",\"20:00\"]")
                .instructions("Take after meals")
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusWeeks(2))
                .stock(40)
                .refillAt(5)
                .color("#10b981")
                .build();

        MvcResult createResult = mockMvc.perform(post("/api/medicines")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(med)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Metformin")))
                .andExpect(jsonPath("$.stock", is(40)))
                .andReturn();

        Medicine createdMed = objectMapper.readValue(createResult.getResponse().getContentAsString(), Medicine.class);
        Integer medicineId = createdMed.getId();

        // 2. Read Medicines list
        mockMvc.perform(get("/api/medicines")
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Metformin")));

        // 3. Update Medicine details
        Medicine updateData = Medicine.builder().dosage("850mg").stock(35).build();
        mockMvc.perform(put("/api/medicines/" + medicineId)
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dosage", is("850mg")))
                .andExpect(jsonPath("$.stock", is(35)));

        // 4. Record taking the medicine
        mockMvc.perform(post("/api/medicines/" + medicineId + "/take")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"date\":\"2026-07-27\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stock", is(34))) // reduced by 1
                .andExpect(jsonPath("$.takenDates", containsString("2026-07-27")));

        // 5. Delete Medicine
        mockMvc.perform(delete("/api/medicines/" + medicineId)
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());

        // Verify count is 0 in DB
        assertEquals(0, medicineRepository.findByPatientId(testUser.getId()).size());
    }
}
