package com.evoting.result.repository;

import com.evoting.result.model.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ResultRepository extends JpaRepository<Result, Integer> {
    List<Result> findByElectionId(Integer electionId);

    void deleteByElectionId(Integer electionId);
}
