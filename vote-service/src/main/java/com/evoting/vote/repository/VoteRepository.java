package com.evoting.vote.repository;

import com.evoting.vote.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, Integer> {
    List<Vote> findByElectionId(Integer electionId);

    List<Vote> findByVoterId(Integer voterId);

    boolean existsByElectionIdAndVoterId(Integer electionId, Integer voterId);
}
