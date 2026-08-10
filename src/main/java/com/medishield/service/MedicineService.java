package com.medishield.service;

import com.medishield.model.Medicine;
import com.medishield.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    public List<Medicine> getMedicinesByPatient(Integer patientId) {
        if (patientId == null) {
            throw new IllegalArgumentException("Patient ID cannot be null");
        }
        return medicineRepository.findByPatientId(patientId);
    }

    @Transactional
    public Medicine createMedicine(Integer patientId, Medicine medicine) {
        if (patientId == null || medicine == null) {
            throw new IllegalArgumentException("Patient ID and Medicine data cannot be null");
        }
        if (medicine.getName() == null || medicine.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Medicine name cannot be empty");
        }
        if (medicine.getDosage() == null || medicine.getDosage().trim().isEmpty()) {
            throw new IllegalArgumentException("Dosage cannot be empty");
        }
        if (medicine.getStock() != null && medicine.getStock() < 0) {
            throw new IllegalArgumentException("Medicine stock cannot be negative");
        }
        if (medicine.getStartDate() != null && medicine.getEndDate() != null 
                && medicine.getStartDate().isAfter(medicine.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        medicine.setPatientId(patientId);
        if (medicine.getTimings() == null) {
            medicine.setTimings("[\"08:00\"]");
        }
        if (medicine.getTakenDates() == null) {
            medicine.setTakenDates("[]");
        }
        if (medicine.getMissedDates() == null) {
            medicine.setMissedDates("[]");
        }
        medicine.setIsActive(true);

        return medicineRepository.save(medicine);
    }

    @Transactional
    public Medicine updateMedicine(Integer patientId, Integer medicineId, Medicine updatedData) {
        if (patientId == null || medicineId == null || updatedData == null) {
            throw new IllegalArgumentException("Invalid arguments for update");
        }
        Medicine existing = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + medicineId));

        if (!existing.getPatientId().equals(patientId)) {
            throw new IllegalStateException("Unauthorized: Medicine does not belong to patient");
        }

        if (updatedData.getName() != null && !updatedData.getName().trim().isEmpty()) {
            existing.setName(updatedData.getName());
        }
        if (updatedData.getDosage() != null && !updatedData.getDosage().trim().isEmpty()) {
            existing.setDosage(updatedData.getDosage());
        }
        if (updatedData.getFrequency() != null) {
            existing.setFrequency(updatedData.getFrequency());
        }
        if (updatedData.getTimings() != null) {
            existing.setTimings(updatedData.getTimings());
        }
        if (updatedData.getInstructions() != null) {
            existing.setInstructions(updatedData.getInstructions());
        }
        if (updatedData.getStartDate() != null) {
            existing.setStartDate(updatedData.getStartDate());
        }
        if (updatedData.getEndDate() != null) {
            existing.setEndDate(updatedData.getEndDate());
        }
        if (updatedData.getStock() != null) {
            if (updatedData.getStock() < 0) {
                throw new IllegalArgumentException("Stock cannot be negative");
            }
            existing.setStock(updatedData.getStock());
        }
        if (updatedData.getRefillAt() != null) {
            existing.setRefillAt(updatedData.getRefillAt());
        }
        if (updatedData.getColor() != null) {
            existing.setColor(updatedData.getColor());
        }
        if (updatedData.getIsActive() != null) {
            existing.setIsActive(updatedData.getIsActive());
        }

        return medicineRepository.save(existing);
    }

    @Transactional
    public void deleteMedicine(Integer patientId, Integer medicineId) {
        if (patientId == null || medicineId == null) {
            throw new IllegalArgumentException("Patient ID and Medicine ID cannot be null");
        }
        Medicine existing = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + medicineId));

        if (!existing.getPatientId().equals(patientId)) {
            throw new IllegalStateException("Unauthorized: Medicine does not belong to patient");
        }

        medicineRepository.delete(existing);
    }

    @Transactional
    public Medicine takeMedicine(Integer patientId, Integer medicineId, String dateStr) {
        if (patientId == null || medicineId == null || dateStr == null) {
            throw new IllegalArgumentException("Invalid request arguments");
        }
        Medicine existing = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new RuntimeException("Medicine not found with ID: " + medicineId));

        if (!existing.getPatientId().equals(patientId)) {
            throw new IllegalStateException("Unauthorized: Medicine does not belong to patient");
        }

        if (existing.getStock() != null && existing.getStock() > 0) {
            existing.setStock(existing.getStock() - 1);
        } else {
            throw new IllegalStateException("Medicine out of stock");
        }

        // Add dateStr to takenDates JSON array string. Very basic string manipulation for safety.
        String currentTaken = existing.getTakenDates();
        if (currentTaken == null || currentTaken.equals("[]") || currentTaken.isEmpty()) {
            existing.setTakenDates("[\"" + dateStr + "\"]");
        } else {
            existing.setTakenDates(currentTaken.substring(0, currentTaken.length() - 1) + ",\"" + dateStr + "\"]");
        }

        return medicineRepository.save(existing);
    }
}
