package com.evoting.vote.controller;

import com.evoting.vote.dto.VoteRequest;
import com.evoting.vote.model.Vote;
import com.evoting.vote.service.VoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/vote")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService service;

    @PostMapping
    public ResponseEntity<Vote> castVote(@RequestHeader("X-User-Id") Integer userId, @RequestBody VoteRequest request) {
        if (userId == null)
            userId = 999; // Fallback dev
        return ResponseEntity.ok(service.castVote(userId, request));
    }

    @GetMapping("/my-votes")
    public ResponseEntity<java.util.List<Vote>> getMyVotes(@RequestHeader("X-User-Id") Integer userId) {
        if (userId == null)
            userId = 999;
        return ResponseEntity.ok(service.getUserVotes(userId));
    }

    @GetMapping("/{electionId}/tally")
    public ResponseEntity<java.util.Map<Integer, Long>> getTally(@PathVariable Integer electionId) {
        return ResponseEntity.ok(service.tallyVotes(electionId));
    }
}
