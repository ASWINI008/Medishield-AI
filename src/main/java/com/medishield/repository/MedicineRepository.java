package com.medishield.repository;

import com.medishield.model.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Integer> {
    List<Medicine> findByPatientId(Integer patientId);
    List<Medicine> findByPatientIdAndIsActive(Integer patientId, Boolean isActive);
}
