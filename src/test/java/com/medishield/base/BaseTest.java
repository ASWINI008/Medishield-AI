package com.medishield.base;

import com.medishield.factory.DriverFactory;
import org.openqa.selenium.WebDriver;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Optional;
import org.testng.annotations.Parameters;

public class BaseTest {

    protected WebDriver driver;

    @BeforeMethod
    @Parameters({"browser", "headless"})
    public void setUp(@Optional("chrome") String browser, @Optional("true") String headless) {
        boolean isHeadless = Boolean.parseBoolean(headless);
        driver = DriverFactory.initDriver(browser, isHeadless);
    }

    @AfterMethod
    public void tearDown() {
        DriverFactory.quitDriver();
    }
}
