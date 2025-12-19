package com.evoting.elector.service;

import com.evoting.elector.model.Elector;
import com.evoting.elector.model.ElectorStatus;
import com.evoting.elector.repository.ElectorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ElectorService {

    private final ElectorRepository repository;

    @org.springframework.beans.factory.annotation.Value("${file.upload-dir:uploads/electors}")
    private String uploadDir;

    public Elector createElector(String firstName, String lastName, String party, String bio,
            org.springframework.web.multipart.MultipartFile image) {
        String imagePath = null;
        if (image != null && !image.isEmpty()) {
            imagePath = saveImage(image);
        }

        Elector elector = Elector.builder()
                .firstName(firstName)
                .lastName(lastName)
                .party(party)
                .bio(bio)
                .imagePath(imagePath)
                .status(ElectorStatus.VERIFIED) // Admin creates them, so auto-verified? Or PENDING? Assuming VERIFIED.
                .build();

        return repository.save(elector);
    }

    public Elector updateElector(Integer id, String firstName, String lastName, String party, String bio,
            org.springframework.web.multipart.MultipartFile image) {
        Elector elector = repository.findById(id).orElseThrow(() -> new RuntimeException("Elector not found"));

        if (firstName != null)
            elector.setFirstName(firstName);
        if (lastName != null)
            elector.setLastName(lastName);
        if (party != null)
            elector.setParty(party);
        if (bio != null)
            elector.setBio(bio);
        if (image != null && !image.isEmpty()) {
            elector.setImagePath(saveImage(image));
        }

        return repository.save(elector);
    }

    public void deleteElector(Integer id) {
        repository.deleteById(id);
    }

    public List<Elector> getAllElectors() {
        return repository.findAll();
    }

    public Elector getElector(Integer id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Elector not found"));
    }

    private String saveImage(org.springframework.web.multipart.MultipartFile file) {
        try {
            String fileName = java.util.UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            java.nio.file.Path path = java.nio.file.Paths.get(uploadDir);
            if (!java.nio.file.Files.exists(path)) {
                java.nio.file.Files.createDirectories(path);
            }
            java.nio.file.Path filePath = path.resolve(fileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath,
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            return filePath.toString();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to save image", e);
        }
    }

    // Serve Image
    public org.springframework.core.io.Resource getElectorImage(Integer id) {
        Elector elector = getElector(id);
        if (elector.getImagePath() == null)
            throw new RuntimeException("No image");
        try {
            java.nio.file.Path file = java.nio.file.Paths.get(elector.getImagePath());
            return new org.springframework.core.io.UrlResource(file.toUri());
        } catch (Exception e) {
            throw new RuntimeException("Error reading image", e);
        }
    }
}
