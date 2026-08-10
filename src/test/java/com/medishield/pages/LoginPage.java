package com.medishield.pages;

import com.medishield.base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class LoginPage extends BasePage {

    // Locators
    private final By emailInput = By.name("email");
    private final By passwordInput = By.name("password");
    private final By nameInput = By.name("name");
    private final By roleSelect = By.name("role");
    private final By submitBtn = By.xpath("//button[@type='submit']");
    private final By toggleBtn = By.xpath("//button[contains(text(),'Sign Up') or contains(text(),'Log In')]");
    private final By errorAlert = By.xpath("//div[contains(@class,'text-red-700')]");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public void enterEmail(String email) {
        writeText(emailInput, email);
    }

    public void enterPassword(String password) {
        writeText(passwordInput, password);
    }

    public void enterName(String name) {
        writeText(nameInput, name);
    }

    public void selectRole(String role) {
        writeText(roleSelect, role);
    }

    public void clickSubmit() {
        click(submitBtn);
    }

    public void clickToggleState() {
        click(toggleBtn);
    }

    public String getErrorMessage() {
        return readText(errorAlert);
    }

    public boolean isErrorDisplayed() {
        return isDisplayed(errorAlert);
    }

    public void login(String email, String password) {
        enterEmail(email);
        enterPassword(password);
        clickSubmit();
    }

    public void register(String name, String email, String password, String role) {
        clickToggleState(); // Switch to Register form
        enterName(name);
        enterEmail(email);
        enterPassword(password);
        selectRole(role);
        clickSubmit();
    }
}
