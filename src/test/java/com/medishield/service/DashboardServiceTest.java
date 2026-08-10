package com.medishield.service;

import com.medishield.model.Medicine;
import com.medishield.repository.MedicineRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Arrays;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DashboardServiceTest {

    @Mock
    private MedicineRepository medicineRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    public void testGetDashboardAnalytics_CalculationSuccess() {
        Medicine m1 = Medicine.builder()
                .patientId(1)
                .name("Med A")
                .isActive(true)
                .stock(3) // Low stock (<=5)
                .refillAt(5)
                .takenDates("[\"2026-07-26\",\"2026-07-27\"]") // 2 taken
                .missedDates("[\"2026-07-25\"]") // 1 missed
                .build();

        Medicine m2 = Medicine.builder()
                .patientId(1)
                .name("Med B")
                .isActive(false)
                .stock(10)
                .refillAt(5)
                .takenDates("[]")
                .missedDates("[]")
                .build();

        when(medicineRepository.findByPatientId(1)).thenReturn(Arrays.asList(m1, m2));

        Map<String, Object> analytics = dashboardService.getDashboardAnalytics(1);

        assertNotNull(analytics);
        assertEquals(2, analytics.get("totalMedicines"));
        assertEquals(1, analytics.get("activeMedicines"));
        assertEquals(1, analytics.get("lowStockCount"));
        // Taken: 2, Missed: 1. Adherence: 2 / 3 * 100 = 66.7%
        assertEquals(66.7, analytics.get("adherenceRate"));
    }

    @Test
    public void testGetDashboardAnalytics_NullPatientId_ThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> dashboardService.getDashboardAnalytics(null));
    }
}
