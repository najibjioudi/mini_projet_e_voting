package com.evoting.voter.service;

import com.evoting.voter.client.OcrClient;
import com.evoting.voter.client.OcrResponse;
import com.evoting.voter.dto.VoterRegistrationRequest;
import com.evoting.voter.model.Voter;
import com.evoting.voter.model.VoterStatus;
import com.evoting.voter.repository.VoterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoterService {

    private final VoterRepository repository;
    private final OcrClient ocrClient;

    @Value("${file.upload-dir:uploads/cin}")
    private String uploadDir;

    public Voter registerVoter(Integer userId, VoterRegistrationRequest request, MultipartFile cinImage) {
        log.info("Processing registration for UserID: {}", userId);

        if (repository.findByUserId(userId).isPresent()) {
            throw new RuntimeException("User already has a linked voter profile");
        }

        // Save file to disk
        String fileName = UUID.randomUUID().toString() + "_" + cinImage.getOriginalFilename();
        Path uploadPath = Paths.get(uploadDir);
        String relativePath = null;

        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(cinImage.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            relativePath = filePath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store CIN image", e);
        }

        // Save initial PENDING state
        Voter voter = Voter.builder()
                .userId(userId)
                .cin(request.getCin())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .dob(request.getDob())
                .cinImagePath(relativePath)
                .status(VoterStatus.PENDING)
                .build();

        voter = repository.save(voter);

        // Call OCR Service
        try {
            OcrResponse ocrResult = ocrClient.verify(cinImage).getBody();
            if (ocrResult == null) {
                voter.setStatus(VoterStatus.MANUAL_REVIEW);
                voter.setRejectionReason("OCR Service returned empty response");
                return repository.save(voter);
            }

            log.info("OCR Result for {}: CIN={}, Conf={}", userId, ocrResult.getExtractedCin(),
                    ocrResult.getConfidence());

            // 1. Validate CIN
            if (ocrResult.getExtractedCin() == null
                    || !ocrResult.getExtractedCin().equalsIgnoreCase(request.getCin())) {
                voter.setStatus(VoterStatus.REJECTED);
                voter.setRejectionReason("CIN mismatch: OCR found " + ocrResult.getExtractedCin());
                return repository.save(voter);
            }

            // 2. Validate Age
            if (Period.between(request.getDob(), LocalDate.now()).getYears() < 18) {
                voter.setStatus(VoterStatus.REJECTED);
                voter.setRejectionReason("Underage voter");
                return repository.save(voter);
            }

            // 3. Mark as Verified if all good
            voter.setStatus(VoterStatus.VERIFIED);

        } catch (Exception e) {
            log.error("Error during OCR verification", e);
            voter.setStatus(VoterStatus.MANUAL_REVIEW);
            voter.setRejectionReason("System error during verification: " + e.getMessage());
        }

        return repository.save(voter);
    }

    public List<Voter> getAllVoters() {
        return repository.findAll();
    }

    public Voter updateVoterStatus(Integer id, VoterStatus status, String reason) {
        Voter voter = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voter not found with ID: " + id));

        voter.setStatus(status);

        if (status == VoterStatus.REJECTED || status == VoterStatus.MANUAL_REVIEW) {
            voter.setRejectionReason(reason != null ? reason : "No reason provided");
        } else {
            voter.setRejectionReason(null); // Clear rejection reason if status is VERIFIED/PENDING
        }

        return repository.save(voter);
    }

    public org.springframework.core.io.Resource getCinImage(Integer id) {
        Voter voter = repository.findById(id).orElseThrow(() -> new RuntimeException("Voter not found"));
        if (voter.getCinImagePath() == null) {
            throw new RuntimeException("No image found for this voter");
        }

        try {
            Path file = Paths.get(voter.getCinImagePath());
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read file: " + voter.getCinImagePath());
            }
        } catch (java.net.MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }

    public Voter getVoterByUserId(Integer userId) {
        return repository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Voter profile not found for user ID: " + userId));
    }
}
