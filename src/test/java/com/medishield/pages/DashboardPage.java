package com.medishield.pages;

import com.medishield.base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class DashboardPage extends BasePage {

    // Locators
    private final By welcomeHeader = By.xpath("//h1");
    private final By healthScoreCard = By.xpath("//*[contains(text(), 'Health Score')]");
    private final By adherenceCard = By.xpath("//*[contains(text(), 'Adherence')]");
    private final By lowStockCard = By.xpath("//*[contains(text(), 'Low Stock')]");
    private final By signOutBtn = By.xpath("//button[contains(text(),'Sign Out')]");

    // Sidebar navigation items
    private final By dashboardTab = By.xpath("//button[span[contains(text(), 'Dashboard')]]");
    private final By medicinesTab = By.xpath("//button[span[contains(text(), 'Medicines')]]");
    private final By aiAssistantTab = By.xpath("//button[span[contains(text(), 'AI Assistant')]]");
    private final By emergencyTab = By.xpath("//button[span[contains(text(), 'Emergency Alerts')]]");
    private final By settingsTab = By.xpath("//button[span[contains(text(), 'Settings')]]");

    public DashboardPage(WebDriver driver) {
        super(driver);
    }

    public String getWelcomeText() {
        return readText(welcomeHeader);
    }

    public boolean isHealthScoreCardVisible() {
        return isDisplayed(healthScoreCard);
    }

    public boolean isAdherenceCardVisible() {
        return isDisplayed(adherenceCard);
    }

    public void navigateToMedicines() {
        click(medicinesTab);
    }

    public void navigateToAIAssistant() {
        click(aiAssistantTab);
    }

    public void navigateToEmergency() {
        click(emergencyTab);
    }

    public void navigateToSettings() {
        click(settingsTab);
    }

    public void signOut() {
        click(signOutBtn);
    }
}
