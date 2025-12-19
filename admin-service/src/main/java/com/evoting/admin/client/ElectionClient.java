package com.evoting.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@FeignClient(name = "ELECTION-SERVICE")
public interface ElectionClient {

    @PostMapping("/election/create")
    ElectionDto createElection(@RequestBody ElectionRequest request);

    @GetMapping("/election/all")
    List<ElectionDto> getAllElections();

    @PutMapping("/election/{id}/status")
    ElectionDto updateStatus(@PathVariable("id") Integer id, @RequestParam("status") String status);

    @PostMapping("/election/{id}/candidates/{candidateId}")
    ElectionDto addCandidate(@PathVariable("id") Integer id, @PathVariable("candidateId") Integer candidateId);

    @DeleteMapping("/election/{id}")
    void deleteElection(@PathVariable("id") Integer id);

    @lombok.Data
    class ElectionDto {
        private Integer id;
        private String title;
        private String description;
        private String status;
        private LocalDateTime startAt;
        private LocalDateTime endAt;
        private Set<Integer> candidateIds;
    }

    @lombok.Data
    class ElectionRequest {
        private String title;
        private String description;
        private LocalDateTime startAt;
        private LocalDateTime endAt;
        private Set<Integer> candidateIds;
    }
}
