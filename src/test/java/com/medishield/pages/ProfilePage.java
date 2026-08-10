package com.medishield.pages;

import com.medishield.base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class ProfilePage extends BasePage {

    // Tab Locators
    private final By profileTab = By.xpath("//button[contains(text(),'Profile') or contains(., 'Profile')]");
    private final By securityTab = By.xpath("//button[contains(text(),'Security') or contains(., 'Security')]");

    // Profile fields
    private final By nameInput = By.name("name");
    private final By phoneInput = By.name("phone");
    private final By bloodGroupInput = By.name("bloodGroup");
    private final By addressInput = By.name("address");
    private final By saveProfileBtn = By.xpath("//form[@onSubmit='saveProfile']//button[@type='submit'] or //button[contains(text(),'Save')]");

    // Security/Password fields
    private final By currentPassInput = By.name("currentPassword");
    private final By newPassInput = By.name("newPassword");
    private final By confirmPassInput = By.name("confirmPassword");
    private final By savePasswordBtn = By.xpath("//form[@onSubmit='savePassword']//button[@type='submit'] or //button[contains(text(),'Change Password') or contains(text(),'Save Password')]");

    private final By successMessage = By.xpath("//div[contains(@class, 'bg-green-50')]");

    public ProfilePage(WebDriver driver) {
        super(driver);
    }

    public void navigateToProfileTab() {
        click(profileTab);
    }

    public void navigateToSecurityTab() {
        click(securityTab);
    }

    public void updateProfileDetails(String name, String phone, String bloodGroup, String address) {
        navigateToProfileTab();
        writeText(nameInput, name);
        writeText(phoneInput, phone);
        writeText(bloodGroupInput, bloodGroup);
        writeText(addressInput, address);
        click(saveProfileBtn);
    }

    public void updatePassword(String currentPass, String newPass, String confirmPass) {
        navigateToSecurityTab();
        writeText(currentPassInput, currentPass);
        writeText(newPassInput, newPass);
        writeText(confirmPassInput, confirmPass);
        click(savePasswordBtn);
    }

    public boolean isSuccessAlertVisible() {
        return isDisplayed(successMessage);
    }
}
