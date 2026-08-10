package com.medishield.service;

import com.medishield.model.Medicine;
import com.medishield.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    @Autowired
    private MedicineRepository medicineRepository;

    public Map<String, Object> getDashboardAnalytics(Integer patientId) {
        if (patientId == null) {
            throw new IllegalArgumentException("Patient ID cannot be null");
        }

        List<Medicine> medicines = medicineRepository.findByPatientId(patientId);
        int totalMedicines = medicines.size();
        int activeMedicines = 0;
        int lowStockCount = 0;
        int totalTaken = 0;
        int totalMissed = 0;

        for (Medicine med : medicines) {
            if (Boolean.TRUE.equals(med.getIsActive())) {
                activeMedicines++;
            }
            if (med.getStock() != null && med.getStock() <= med.getRefillAt()) {
                lowStockCount++;
            }
            
            // Adherence parsing mock count (since dates are stored as json string array like ["2026-07-27"])
            String taken = med.getTakenDates();
            if (taken != null && taken.contains(",")) {
                totalTaken += taken.split(",").length;
            } else if (taken != null && taken.contains("-")) {
                totalTaken += 1;
            }

            String missed = med.getMissedDates();
            if (missed != null && missed.contains(",")) {
                totalMissed += missed.split(",").length;
            } else if (missed != null && missed.contains("-")) {
                totalMissed += 1;
            }
        }

        double adherenceRate = 100.0;
        int totalDays = totalTaken + totalMissed;
        if (totalDays > 0) {
            adherenceRate = ((double) totalTaken / totalDays) * 100.0;
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalMedicines", totalMedicines);
        analytics.put("activeMedicines", activeMedicines);
        analytics.put("lowStockCount", lowStockCount);
        analytics.put("adherenceRate", Math.round(adherenceRate * 10.0) / 10.0);

        return analytics;
    }
}
