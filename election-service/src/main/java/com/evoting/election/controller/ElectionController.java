package com.evoting.election.controller;

import com.evoting.election.dto.ElectionRequest;
import com.evoting.election.model.Election;
import com.evoting.election.model.ElectionStatus;
import com.evoting.election.service.ElectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/election")
@RequiredArgsConstructor
public class ElectionController {

    private final ElectionService service;

    @PostMapping("/create")
    public ResponseEntity<Election> create(@RequestBody ElectionRequest request) {
        return ResponseEntity.ok(service.createElection(request));
    }

    @GetMapping("/all")
    public List<Election> getAll() {
        return service.getAllElections();
    }

    @GetMapping("/public")
    public List<Election> getPublic() {
        return service.getPublicElections();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Election> updateStatus(
            @PathVariable Integer id,
            @RequestParam ElectionStatus status) {
        return ResponseEntity.ok(service.updateStatus(id, status));
    }

    @PostMapping("/{id}/candidates/{candidateId}")
    public ResponseEntity<Election> addCandidate(@PathVariable Integer id, @PathVariable Integer candidateId) {
        return ResponseEntity.ok(service.addCandidate(id, candidateId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.deleteElection(id);
        return ResponseEntity.noContent().build();
    }
}
