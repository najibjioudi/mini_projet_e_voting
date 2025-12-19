package com.evoting.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@FeignClient(name = "VOTER-SERVICE")
public interface VoterClient {

    @GetMapping("/voter/all")
    java.util.List<VoterDto> getAllVoters();

    @PutMapping("/voter/{id}/status")
    VoterDto updateStatus(@PathVariable("id") Integer id, @RequestParam("status") String status,
            @RequestParam("reason") String reason);

    // Minimal DTO only for Admin view
    @lombok.Data
    class VoterDto {
        private Integer id;
        private Integer userId;
        private String cin;
        private String firstName;
        private String lastName;
        private String status;
        private String rejectionReason;
        private String cinImagePath;
    }
}
