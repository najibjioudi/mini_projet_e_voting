package com.evoting.voter.controller;

import com.evoting.voter.dto.VoterRegistrationRequest;
import com.evoting.voter.model.Voter;
import com.evoting.voter.model.VoterStatus;
import com.evoting.voter.service.VoterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/voter")
@RequiredArgsConstructor
public class VoterController {

    private final VoterService service;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Voter> register(
            @RequestHeader("X-User-Id") Integer userId, // Assuming Gateway propagates this, or we extract from token
            @RequestParam("cin") String cin,
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("dob") String dob,
            @RequestPart("file") MultipartFile file) {
        // Construct DTO
        VoterRegistrationRequest request = new VoterRegistrationRequest();
        request.setCin(cin);
        request.setFirstName(firstName);
        request.setLastName(lastName);
        request.setDob(LocalDate.parse(dob));

        // Use a mock userId if header missing (dev mode) or fail
        Integer actualUserId = (userId != null) ? userId : 1;

        return ResponseEntity.ok(service.registerVoter(actualUserId, request, file));
    }

    @GetMapping("/all")
    public java.util.List<Voter> getAllVoters() {
        // In real world, secure this with PreAuthorize("hasRole('ADMIN')")
        return service.getAllVoters();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Voter> updateStatus(
            @PathVariable Integer id,
            @RequestParam VoterStatus status,
            @RequestParam(required = false) String reason) {
        return ResponseEntity.ok(service.updateVoterStatus(id, status, reason));
    }

    @GetMapping("/{id}/cin-image")
    public ResponseEntity<org.springframework.core.io.Resource> getCinImage(@PathVariable Integer id) {
        org.springframework.core.io.Resource file = service.getCinImage(id);

        // Try to determine file's content type
        String contentType = "application/octet-stream";
        try {
            contentType = java.nio.file.Files.probeContentType(file.getFile().toPath());
        } catch (java.io.IOException e) {
            // fallback
        }

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }

    @GetMapping("/me")
    public ResponseEntity<Voter> getMe(@RequestHeader("X-User-Id") Integer userId) {
        if (userId == null) {
            // Fallback or Error? Ideally Error if protected.
            // But for dev alignment with Register:
            userId = 1;
        }
        return ResponseEntity.ok(service.getVoterByUserId(userId));
    }
}
