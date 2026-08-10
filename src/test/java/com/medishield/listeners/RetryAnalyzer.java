package com.medishield.listeners;

import org.testng.IRetryAnalyzer;
import org.testng.ITestResult;

public class RetryAnalyzer implements IRetryAnalyzer {

    private int count = 0;
    private static final int MAX_LIMIT = 2; // Retry flaky tests up to 2 times

    @Override
    public boolean retry(ITestResult result) {
        if (!result.isSuccess()) {
            if (count < MAX_LIMIT) {
                count++;
                return true; // Retry test
            }
        }
        return false;
    }
}
