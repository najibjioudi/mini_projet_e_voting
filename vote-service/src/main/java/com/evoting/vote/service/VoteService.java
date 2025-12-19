package com.evoting.vote.service;

import com.evoting.vote.dto.VoteRequest;
import com.evoting.vote.model.Vote;
import com.evoting.vote.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final VoteRepository voteRepository;

    @Transactional
    public Vote castVote(Integer voterId, VoteRequest request) {
        // 1. Check double voting
        if (voteRepository.existsByElectionIdAndVoterId(request.getElectionId(), voterId)) {
            throw new RuntimeException("You have already voted in this election");
        }

        // 2. Record Vote directly (No encryption, tracking participation in same table)
        Vote vote = Vote.builder()
                .electionId(request.getElectionId())
                .voterId(voterId)
                .candidateId(request.getCandidateId())
                .build();

        return voteRepository.save(vote);
    }

    public java.util.List<Vote> getUserVotes(Integer voterId) {
        return voteRepository.findByVoterId(voterId);
    }

    // INTERNAL/ADMIN ONLY
    public java.util.Map<Integer, Long> tallyVotes(Integer electionId) {
        java.util.List<Vote> votes = voteRepository.findByElectionId(electionId);
        java.util.Map<Integer, Long> results = new java.util.HashMap<>();

        for (Vote vote : votes) {
            Integer candidateId = vote.getCandidateId();
            results.put(candidateId, results.getOrDefault(candidateId, 0L) + 1);
        }
        return results;
    }
}
