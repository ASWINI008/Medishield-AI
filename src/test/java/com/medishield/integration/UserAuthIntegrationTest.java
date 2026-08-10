package com.medishield.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medishield.dto.AuthRequest;
import com.medishield.dto.RegisterRequest;
import com.medishield.model.User;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // Automatically rolls back database modifications after each test
public class UserAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void cleanDatabase() {
        userRepository.deleteAll();
    }

    @Test
    public void testUserRegistrationAndLoginFlow() throws Exception {
        // 1. Register User
        RegisterRequest registerReq = new RegisterRequest("Aswin Nair", "aswin@example.com", "securePass123", "patient", "9876543210");
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.email", is("aswin@example.com")))
                .andExpect(jsonPath("$.role", is("patient")));

        // 2. Perform Login to obtain JWT Token
        AuthRequest loginReq = new AuthRequest("aswin@example.com", "securePass123");
        
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("aswin@example.com")))
                .andReturn();

        String responseContent = loginResult.getResponse().getContentAsString();
        Map<?, ?> responseMap = objectMapper.readValue(responseContent, Map.class);
        String jwtToken = (String) responseMap.get("token");
        assertNotNull(jwtToken);

        // 3. Request Secured Profile endpoint using Bearer Token
        mockMvc.perform(get("/api/users/profile")
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Aswin Nair")))
                .andExpect(jsonPath("$.email", is("aswin@example.com")));
    }

    @Test
    public void testRoleAuthentication_PatientCannotAccessAdminAPI() throws Exception {
        // Register and login as patient
        RegisterRequest registerReq = new RegisterRequest("Patient User", "pat@example.com", "password123", "patient", "000");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk());

        AuthRequest loginReq = new AuthRequest("pat@example.com", "password123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andReturn();

        Map<?, ?> responseMap = objectMapper.readValue(loginResult.getResponse().getContentAsString(), Map.class);
        String jwtToken = (String) responseMap.get("token");

        // Attempting to access admin analytics should yield 403 Forbidden
        mockMvc.perform(get("/api/admin/analytics")
                .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testUnsecuredRequestToProfile_Returns403() throws Exception {
        // Missing Authorization header
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isForbidden());
    }
}
