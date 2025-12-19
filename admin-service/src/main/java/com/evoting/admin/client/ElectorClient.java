package com.evoting.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "ELECTOR-SERVICE")
public interface ElectorClient {

    @GetMapping("/elector/all")
    List<ElectorDto> getAllElectors();

    // Status update logic changed? The Controller now exposes a generic CRUD.
    // But AdminController uses a specific verify/reject flow which might map to
    // status update.
    // The ElectorService has 'updateElector' which is generic.

    // Supporting the existing 'updateStatus' if it was kept?
    // Wait, I removed updateStatus from ElectorController and replaced it with
    // generic update.
    // Ah, I need to check ElectorController again.

    // Let's add the DELETE endpoint here too.
    @DeleteMapping("/elector/{id}")
    void deleteElector(@PathVariable("id") Integer id);

    @lombok.Data
    class ElectorDto {
        private Integer id;
        private String firstName;
        private String lastName;
        private String party;
        private String bio;
        private String imagePath;
        private String status;
    }
}
