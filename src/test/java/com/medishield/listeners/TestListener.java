package com.medishield.listeners;

import com.aventstack.extentreports.Status;
import com.medishield.reports.ExtentReportManager;
import com.medishield.utils.ScreenshotUtils;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TestListener implements ITestListener {

    private static final Logger log = LoggerFactory.getLogger(TestListener.class);

    @Override
    public void onStart(ITestContext context) {
        log.info("Starting Test Suite: {}", context.getName());
    }

    @Override
    public void onFinish(ITestContext context) {
        log.info("Finishing Test Suite. Flushing report...");
        ExtentReportManager.flush();
    }

    @Override
    public void onTestStart(ITestResult result) {
        log.info("Started Test: {}", result.getMethod().getMethodName());
        ExtentReportManager.createTest(result.getMethod().getMethodName(), result.getMethod().getDescription());
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        log.info("Test Passed: {}", result.getMethod().getMethodName());
        ExtentReportManager.getTest().log(Status.PASS, "Test Case Passed: " + result.getMethod().getMethodName());
    }

    @Override
    public void onTestFailure(ITestResult result) {
        log.error("Test Failed: {}", result.getMethod().getMethodName(), result.getThrowable());
        ExtentReportManager.getTest().log(Status.FAIL, "Test Case Failed: " + result.getMethod().getMethodName());
        ExtentReportManager.getTest().log(Status.FAIL, result.getThrowable());

        // Capture screenshot for Selenium UI failures
        String screenshotPath = ScreenshotUtils.captureScreenshot(result.getMethod().getMethodName());
        if (screenshotPath != null) {
            try {
                ExtentReportManager.getTest().addScreenCaptureFromPath(screenshotPath);
            } catch (Exception e) {
                log.error("Failed to attach screenshot to report", e);
            }
        }
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        log.warn("Test Skipped: {}", result.getMethod().getMethodName());
        ExtentReportManager.getTest().log(Status.SKIP, "Test Case Skipped: " + result.getMethod().getMethodName());
    }
}
