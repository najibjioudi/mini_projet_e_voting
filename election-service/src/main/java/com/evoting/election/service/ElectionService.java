package com.evoting.election.service;

import com.evoting.election.dto.ElectionRequest;
import com.evoting.election.model.Election;
import com.evoting.election.model.ElectionStatus;
import com.evoting.election.repository.ElectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ElectionService {

    private final ElectionRepository repository;

    public Election createElection(ElectionRequest request) {
        Election election = Election.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .candidateIds(request.getCandidateIds())
                .status(ElectionStatus.DRAFT)
                .build();
        return repository.save(election);
    }

    public List<Election> getAllElections() {
        return repository.findAll();
    }

    public List<Election> getPublicElections() {
        return repository.findByStatus(ElectionStatus.OPEN);
        // Might also want creation status == PUBLISHED for results later
    }

    public Election updateStatus(Integer id, ElectionStatus status) {
        Election election = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Election not found"));
        election.setStatus(status);
        return repository.save(election);
    }

    public Election addCandidate(Integer electionId, Integer candidateId) {
        Election election = repository.findById(electionId)
                .orElseThrow(() -> new RuntimeException("Election not found"));
        if (election.getStatus() != ElectionStatus.DRAFT) {
            throw new RuntimeException("Cannot add candidate to non-draft election");
        }
        election.getCandidateIds().add(candidateId);
        return repository.save(election);
    }

    public void deleteElection(Integer id) {
        Election election = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Election not found"));
        // Optional safety rule
        if (election.getStatus() != ElectionStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT elections can be deleted");
        }
        repository.delete(election);
    }
}
