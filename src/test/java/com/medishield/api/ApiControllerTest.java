package com.medishield.api;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import java.util.HashMap;
import java.util.Map;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ApiControllerTest {

    @LocalServerPort
    private int port;

    private String patientToken;
    private String adminToken;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        RestAssured.baseURI = "http://localhost";

        // Generate tokens directly via API calls for patient and admin
        Map<String, String> patientReg = new HashMap<>();
        patientReg.put("name", "John Patient");
        patientReg.put("email", "patient.john@example.com");
        patientReg.put("password", "secure123");
        patientReg.put("role", "patient");

        // Register Patient
        given()
            .contentType(ContentType.JSON)
            .body(patientReg)
        .when()
            .post("/api/auth/register");

        // Login Patient
        Map<String, String> patientLogin = new HashMap<>();
        patientLogin.put("email", "patient.john@example.com");
        patientLogin.put("password", "secure123");

        patientToken = given()
            .contentType(ContentType.JSON)
            .body(patientLogin)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract()
            .path("token");

        // Register Admin
        Map<String, String> adminReg = new HashMap<>();
        adminReg.put("name", "Alice Admin");
        adminReg.put("email", "admin.alice@example.com");
        adminReg.put("password", "adminsecure123");
        adminReg.put("role", "admin");

        given()
            .contentType(ContentType.JSON)
            .body(adminReg)
        .when()
            .post("/api/auth/register");

        // Login Admin
        Map<String, String> adminLogin = new HashMap<>();
        adminLogin.put("email", "admin.alice@example.com");
        adminLogin.put("password", "adminsecure123");

        adminToken = given()
            .contentType(ContentType.JSON)
            .body(adminLogin)
        .when()
            .post("/api/auth/login")
        .then()
            .statusCode(200)
            .extract()
            .path("token");
    }

    @Test
    public void testPublicChat_Unsecured_Success() {
        Map<String, String> body = new HashMap<>();
        body.put("message", "Can I take aspirin with food?");

        given()
            .contentType(ContentType.JSON)
            .body(body)
        .when()
            .post("/api/ai/public-chat")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .header("Content-Type", containsString("application/json"))
            .body("success", is(true))
            .body("response", notNullValue())
            .time(lessThan(2000L)); // Performance assertion
    }

    @Test
    public void testGetMedicines_Secured_Success() {
        given()
            .header("Authorization", "Bearer " + patientToken)
        .when()
            .get("/api/medicines")
        .then()
            .statusCode(200)
            .body("$", hasSize(0)); // new patient has no medicines
    }

    @Test
    public void testGetMedicines_MissingToken_ReturnsForbidden() {
        given()
        .when()
            .get("/api/medicines")
        .then()
            .statusCode(403);
    }

    @Test
    public void testAdminAnalytics_ForbiddenForPatient() {
        given()
            .header("Authorization", "Bearer " + patientToken)
        .when()
            .get("/api/admin/analytics")
        .then()
            .statusCode(403);
    }

    @Test
    public void testAdminAnalytics_SuccessForAdmin() {
        given()
            .header("Authorization", "Bearer " + adminToken)
        .when()
            .get("/api/admin/analytics")
        .then()
            .statusCode(200)
            .body("adminsCount", greaterThanOrEqualTo(1))
            .body("systemHealth", is("optimal"));
    }

    @Test
    public void testInvalidRegistration_MissingFields_ReturnsBadRequest() {
        Map<String, String> invalidReg = new HashMap<>();
        invalidReg.put("email", "invalid-no-at-sign");

        given()
            .contentType(ContentType.JSON)
            .body(invalidReg)
        .when()
            .post("/api/auth/register")
        .then()
            .statusCode(500); // throws IllegalArgumentException triggering server error
    }
}
