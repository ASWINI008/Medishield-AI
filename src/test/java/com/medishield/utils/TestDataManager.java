package com.medishield.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;

public class TestDataManager {

    private static JsonNode rootNode;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    static {
        try (InputStream is = TestDataManager.class.getResourceAsStream("/data/test-data.json")) {
            if (is != null) {
                rootNode = objectMapper.readTree(is);
            } else {
                throw new RuntimeException("Could not find test-data.json in resources");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static JsonNode getUserData(String key) {
        return rootNode.path("users").path(key);
    }

    public static JsonNode getMedicineData(String key) {
        return rootNode.path("medicines").path(key);
    }
}
