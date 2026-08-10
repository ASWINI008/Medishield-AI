package com.medishield.service;

import com.medishield.model.Medicine;
import com.medishield.repository.MedicineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDate;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MedicineServiceTest {

    @Mock
    private MedicineRepository medicineRepository;

    @InjectMocks
    private MedicineService medicineService;

    private Medicine sampleMedicine;

    @BeforeEach
    public void setUp() {
        sampleMedicine = Medicine.builder()
                .id(10)
                .patientId(1)
                .name("Aspirin")
                .dosage("100mg")
                .frequency("once")
                .stock(10)
                .refillAt(3)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(10))
                .takenDates("[]")
                .isActive(true)
                .build();
    }

    @Test
    public void testCreateMedicine_Success() {
        when(medicineRepository.save(any(Medicine.class))).thenAnswer(i -> i.getArguments()[0]);

        Medicine created = medicineService.createMedicine(1, sampleMedicine);

        assertNotNull(created);
        assertEquals("Aspirin", created.getName());
        assertEquals(1, created.getPatientId());
        assertTrue(created.getIsActive());
    }

    @Test
    public void testCreateMedicine_EmptyName_ThrowsException() {
        sampleMedicine.setName("");
        assertThrows(IllegalArgumentException.class, () -> medicineService.createMedicine(1, sampleMedicine));
    }

    @Test
    public void testCreateMedicine_NegativeStock_ThrowsException() {
        sampleMedicine.setStock(-5);
        assertThrows(IllegalArgumentException.class, () -> medicineService.createMedicine(1, sampleMedicine));
    }

    @Test
    public void testCreateMedicine_StartDateAfterEndDate_ThrowsException() {
        sampleMedicine.setStartDate(LocalDate.now().plusDays(2));
        sampleMedicine.setEndDate(LocalDate.now());
        assertThrows(IllegalArgumentException.class, () -> medicineService.createMedicine(1, sampleMedicine));
    }

    @Test
    public void testUpdateMedicine_Success() {
        Medicine updatedDetails = Medicine.builder().name("Ibuprofen").dosage("200mg").stock(20).build();
        when(medicineRepository.findById(10)).thenReturn(Optional.of(sampleMedicine));
        when(medicineRepository.save(any(Medicine.class))).thenAnswer(i -> i.getArguments()[0]);

        Medicine updated = medicineService.updateMedicine(1, 10, updatedDetails);

        assertNotNull(updated);
        assertEquals("Ibuprofen", updated.getName());
        assertEquals("200mg", updated.getDosage());
        assertEquals(20, updated.getStock());
    }

    @Test
    public void testUpdateMedicine_UnauthorizedUser_ThrowsException() {
        Medicine updatedDetails = Medicine.builder().name("Ibuprofen").build();
        when(medicineRepository.findById(10)).thenReturn(Optional.of(sampleMedicine));

        assertThrows(IllegalStateException.class, () -> medicineService.updateMedicine(9, 10, updatedDetails));
    }

    @Test
    public void testDeleteMedicine_Success() {
        when(medicineRepository.findById(10)).thenReturn(Optional.of(sampleMedicine));
        doNothing().when(medicineRepository).delete(sampleMedicine);

        assertDoesNotThrow(() -> medicineService.deleteMedicine(1, 10));
        verify(medicineRepository, times(1)).delete(sampleMedicine);
    }

    @Test
    public void testDeleteMedicine_Unauthorized_ThrowsException() {
        when(medicineRepository.findById(10)).thenReturn(Optional.of(sampleMedicine));

        assertThrows(IllegalStateException.class, () -> medicineService.deleteMedicine(9, 10));
    }

    @Test
    public void testTakeMedicine_Success() {
        when(medicineRepository.findById(10)).thenReturn(Optional.of(sampleMedicine));
        when(medicineRepository.save(any(Medicine.class))).thenAnswer(i -> i.getArguments()[0]);

        Medicine updated = medicineService.takeMedicine(1, 10, "2026-07-27");

        assertNotNull(updated);
        assertEquals(9, updated.getStock());
        assertTrue(updated.getTakenDates().contains("2026-07-27"));
    }

    @Test
    public void testTakeMedicine_OutOfStock_ThrowsException() {
        sampleMedicine.setStock(0);
        when(medicineRepository.findById(10)).thenReturn(Optional.of(sampleMedicine));

        assertThrows(IllegalStateException.class, () -> medicineService.takeMedicine(1, 10, "2026-07-27"));
    }
}
