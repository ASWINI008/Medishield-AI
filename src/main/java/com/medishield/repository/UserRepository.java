package com.medishield.repository;

import com.medishield.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    List<User> findByCaregiverId(Integer caregiverId);
    List<User> findByRole(String role);
}
