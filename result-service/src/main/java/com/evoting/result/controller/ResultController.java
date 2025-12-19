package com.evoting.result.controller;

import com.evoting.result.model.Result;
import com.evoting.result.service.ResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/result")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService service;

    @GetMapping("/{electionId}")
    public List<Result> getResults(@PathVariable Integer electionId) {
        return service.getResults(electionId);
    }

    // Internal endpoint for Admin/Election service to push results
    @PostMapping("/{electionId}/publish")
    public ResponseEntity<?> publish(@PathVariable Integer electionId, @RequestBody Map<Integer, Long> counts) {
        service.publishResults(electionId, counts);
        return ResponseEntity.ok().build();
    }
}
