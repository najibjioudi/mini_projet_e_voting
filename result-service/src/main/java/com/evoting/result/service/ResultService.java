package com.evoting.result.service;

import com.evoting.result.model.Result;
import com.evoting.result.repository.ResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final ResultRepository repository;

    public List<Result> getResults(Integer electionId) {
        return repository.findByElectionId(electionId);
    }

    public void publishResults(Integer electionId, java.util.Map<Integer, Long> counts) {
        // Clear previous results if any (re-calculation)
        // In real system, might want to keep history
        // repository.deleteByElectionId(electionId); // Needs @Transactional

        counts.forEach((candidateId, count) -> {
            Result result = Result.builder()
                    .electionId(electionId)
                    .candidateId(candidateId)
                    .voteCount(count)
                    .build();
            repository.save(result);
        });
    }
}
