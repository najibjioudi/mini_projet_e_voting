package com.evoting.voter.repository;

import com.evoting.voter.model.Voter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VoterRepository extends JpaRepository<Voter, Integer> {

    Optional<Voter> findByUserId(Integer userId);
    Optional<Voter> findByCin(String cin);
}
