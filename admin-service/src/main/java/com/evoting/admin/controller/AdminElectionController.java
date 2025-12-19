package com.evoting.admin.controller;

import com.evoting.admin.client.ElectionClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/elections")
@RequiredArgsConstructor
public class AdminElectionController {

    private final ElectionClient client;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ElectionClient.ElectionRequest request) {
        return ResponseEntity.ok(client.createElection(request));
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(client.getAllElections());
    }

    @PutMapping("/{id}/open")
    public ResponseEntity<?> openElection(@PathVariable Integer id) {
        return ResponseEntity.ok(client.updateStatus(id, "OPEN"));
    }

    @PutMapping("/{id}/close")
    public ResponseEntity<?> closeElection(@PathVariable Integer id) {
        return ResponseEntity.ok(client.updateStatus(id, "CLOSED"));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer id, @RequestParam String status) {
        return ResponseEntity.ok(client.updateStatus(id, status));
    }

    @PostMapping("/{id}/candidates/{candidateId}")
    public ResponseEntity<?> addCandidate(@PathVariable Integer id, @PathVariable Integer candidateId) {
        return ResponseEntity.ok(client.addCandidate(id, candidateId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        client.deleteElection(id);
        return ResponseEntity.noContent().build();
    }

    // Publish Workflow
    private final com.evoting.admin.client.VoteClient voteClient;
    private final com.evoting.admin.client.ResultClient resultClient;

    @PostMapping("/{id}/publish")
    public ResponseEntity<?> publishResults(@PathVariable Integer id) {
        // 1. Close Election (if not already?) - Optional logic
        client.updateStatus(id, "CLOSED");

        // 2. Tally Votes
        java.util.Map<Integer, Long> results = voteClient.getTally(id);

        // 3. Publish to Result Service
        resultClient.publishResults(id, results);

        // 4. Mark Election as ARCHIVED
        client.updateStatus(id, "ARCHIVED");

        return ResponseEntity.ok("Results published successfully");
    }
}
