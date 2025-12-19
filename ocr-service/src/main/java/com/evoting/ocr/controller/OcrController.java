package com.evoting.ocr.controller;

import com.evoting.ocr.dto.OcrResponse;
import com.evoting.ocr.service.OcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/ocr")
@RequiredArgsConstructor
public class OcrController {

    private final OcrService service;

    @PostMapping("/verify")
    public ResponseEntity<OcrResponse> verify(@RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(service.processImage(file));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
