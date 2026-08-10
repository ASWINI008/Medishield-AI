package com.medishield.pages;

import com.medishield.base.BasePage;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class MedicinePage extends BasePage {

    // Locators
    private final By addMedicineBtn = By.xpath("//button[contains(text(),'Add Medicine')]");
    private final By searchInput = By.xpath("//input[@placeholder='Search medicines...']");
    
    // Modal Locators
    private final By nameInput = By.name("name");
    private final By dosageInput = By.name("dosage");
    private final By frequencySelect = By.name("frequency");
    private final By instructionsText = By.name("instructions");
    private final By stockInput = By.name("stock");
    private final By submitBtn = By.xpath("//form//button[@type='submit']");
    private final By closeModalBtn = By.xpath("//form/preceding-sibling::div//button or //button[svg]");

    // Card Locators
    private final By cardTitle = By.xpath("//h3");
    private final By markTakenBtn = By.xpath("//button[contains(text(),'Mark as Taken') or contains(text(),'Taken Today')]");
    private final By editCardBtn = By.xpath("//button[svg[contains(@class, 'lucide-pencil')]]");
    private final By deleteCardBtn = By.xpath("//button[svg[contains(@class, 'lucide-trash2')]]");

    public MedicinePage(WebDriver driver) {
        super(driver);
    }

    public void clickAddMedicine() {
        click(addMedicineBtn);
    }

    public void searchMedicine(String name) {
        writeText(searchInput, name);
    }

    public void fillMedicineForm(String name, String dosage, String frequency, String instructions, String stock) {
        writeText(nameInput, name);
        writeText(dosageInput, dosage);
        writeText(frequencySelect, frequency);
        writeText(instructionsText, instructions);
        writeText(stockInput, stock);
    }

    public void clickSubmit() {
        click(submitBtn);
    }

    public void addMedicine(String name, String dosage, String frequency, String instructions, String stock) {
        clickAddMedicine();
        fillMedicineForm(name, dosage, frequency, instructions, stock);
        clickSubmit();
    }

    public boolean isMedicineCardVisible(String name) {
        By customCard = By.xpath("//h3[text()='" + name + "']");
        return isDisplayed(customCard);
    }

    public void clickEditMedicine(String name) {
        By customEdit = By.xpath("//div[contains(., '" + name + "')]/following-sibling::div//button[contains(@class, 'lucide-pencil')] or //h3[text()='" + name + "']/ancestor::div[1]//button[1]");
        click(customEdit);
    }

    public void clickDeleteMedicine(String name) {
        By customDelete = By.xpath("//h3[text()='" + name + "']/ancestor::div[1]//button[2]");
        click(customDelete);
    }

    public void markTaken(String name) {
        By customTaken = By.xpath("//h3[text()='" + name + "']/ancestor::div[2]//button[contains(text(), 'Mark as Taken')]");
        click(customTaken);
    }
}
