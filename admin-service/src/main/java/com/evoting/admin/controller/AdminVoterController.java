package com.evoting.admin.controller;

import com.evoting.admin.client.VoterClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/voters")
@RequiredArgsConstructor
public class AdminVoterController {

    private final VoterClient voterClient;

    @GetMapping
    public ResponseEntity<?> getAllVoters() {
        return ResponseEntity.ok(voterClient.getAllVoters());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveVoter(@PathVariable Integer id) {
        return ResponseEntity.ok(voterClient.updateStatus(id, "VERIFIED", "Approved by Admin"));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectVoter(@PathVariable Integer id, @RequestParam String reason) {
        return ResponseEntity.ok(voterClient.updateStatus(id, "REJECTED", reason));
    }
}
