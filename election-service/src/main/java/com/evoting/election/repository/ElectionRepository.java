package com.evoting.election.repository;

import com.evoting.election.model.Election;
import com.evoting.election.model.ElectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ElectionRepository extends JpaRepository<Election, Integer> {
    List<Election> findByStatus(ElectionStatus status);
}
