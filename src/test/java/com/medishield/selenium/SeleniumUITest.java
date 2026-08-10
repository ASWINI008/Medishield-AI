package com.medishield.selenium;

import com.medishield.base.BaseTest;
import com.medishield.pages.DashboardPage;
import com.medishield.pages.LoginPage;
import com.medishield.pages.MedicinePage;
import com.medishield.pages.ProfilePage;
import org.openqa.selenium.By;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testng.Assert;
import org.testng.annotations.Test;

public class SeleniumUITest extends BaseTest {

    private static final Logger log = LoggerFactory.getLogger(SeleniumUITest.class);
    private final String appUrl = System.getProperty("app.url", "http://localhost:5173");

    @Test(priority = 1, groups = {"Smoke", "Sanity"})
    public void testUserRegistrationFlow() {
        log.info("Starting Registration UI Test...");
        driver.get(appUrl);

        LoginPage loginPage = new LoginPage(driver);
        // Generates random suffix to prevent registration duplicate fails
        String randomEmail = "ui.test." + System.currentTimeMillis() + "@example.com";
        
        loginPage.register("Selenium User", randomEmail, "selenium123", "patient");
        log.info("Registration request submitted for email: {}", randomEmail);

        // Verification: After registration, should redirect to dashboard
        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isHealthScoreCardVisible(), "Dashboard failed to load after registration");
        log.info("Registration UI Test Passed successfully.");
    }

    @Test(priority = 2, groups = {"Smoke", "Regression"})
    public void testUserLoginLogoutFlow() {
        log.info("Starting Login/Logout UI Test...");
        driver.get(appUrl);

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login("aswin@example.com", "securePass123");

        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(dashboardPage.isHealthScoreCardVisible(), "Dashboard failed to load after login");

        dashboardPage.signOut();
        // Assert we are back on login page by checking for the login button
        Assert.assertTrue(driver.findElement(By.xpath("//button[@type='submit']")).isDisplayed(), "Sign out failed");
        log.info("Login/Logout UI Test Passed successfully.");
    }

    @Test(priority = 3, groups = {"Regression"})
    public void testMedicineManagement() {
        log.info("Starting Medicine CRUD UI Test...");
        driver.get(appUrl);

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login("aswin@example.com", "securePass123");

        DashboardPage dashboard = new DashboardPage(driver);
        dashboard.navigateToMedicines();

        MedicinePage medPage = new MedicinePage(driver);
        String medName = "UI-Meds-" + System.currentTimeMillis();
        
        medPage.addMedicine(medName, "250mg", "twice", "Take with milk", "50");
        log.info("Added medicine: {}", medName);

        // Assert card is displayed
        Assert.assertTrue(medPage.isMedicineCardVisible(medName), "Added medicine not visible on page");

        // Search for the medicine
        medPage.searchMedicine(medName);
        Assert.assertTrue(medPage.isMedicineCardVisible(medName), "Search failed to find medicine");

        log.info("Medicine CRUD UI Test Passed successfully.");
    }

    @Test(priority = 4, groups = {"Regression"})
    public void testProfileEdits() {
        log.info("Starting Profile Settings UI Test...");
        driver.get(appUrl);

        LoginPage loginPage = new LoginPage(driver);
        loginPage.login("aswin@example.com", "securePass123");

        DashboardPage dashboard = new DashboardPage(driver);
        dashboard.navigateToSettings();

        ProfilePage profilePage = new ProfilePage(driver);
        profilePage.updateProfileDetails("Aswin Nair Updated", "9999999999", "AB+", "AI Labs, Earth");
        log.info("Profile details updated.");

        // Assert success alert shows up
        Assert.assertTrue(profilePage.isSuccessAlertVisible(), "Success profile notification not displayed");
        log.info("Profile Settings UI Test Passed successfully.");
    }
}
