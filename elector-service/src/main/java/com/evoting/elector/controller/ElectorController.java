package com.evoting.elector.controller;

import com.evoting.elector.model.Elector;
import com.evoting.elector.service.ElectorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/elector")
@RequiredArgsConstructor
public class ElectorController {

    private final ElectorService service;

    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Elector> create(
            @RequestParam String firstName,
            @RequestParam String lastName,
            @RequestParam String party,
            @RequestParam String bio,
            @RequestPart(required = false) org.springframework.web.multipart.MultipartFile image) {
        return ResponseEntity.ok(service.createElector(firstName, lastName, party, bio, image));
    }

    @PutMapping(value = "/{id}", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Elector> update(
            @PathVariable Integer id,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String party,
            @RequestParam(required = false) String bio,
            @RequestPart(required = false) org.springframework.web.multipart.MultipartFile image) {
        return ResponseEntity.ok(service.updateElector(id, firstName, lastName, party, bio, image));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.deleteElector(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/all")
    public List<Elector> getAll() {
        return service.getAllElectors();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Elector> getOne(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getElector(id));
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<org.springframework.core.io.Resource> getImage(@PathVariable Integer id) {
        org.springframework.core.io.Resource file = service.getElectorImage(id);
        String contentType = "application/octet-stream";
        // Simple probe
        try {
            contentType = java.nio.file.Files.probeContentType(file.getFile().toPath());
        } catch (Exception e) {
        }

        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }
}
