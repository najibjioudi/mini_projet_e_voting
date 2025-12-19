package com.evoting.voter.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "OCR-SERVICE")
public interface OcrClient {

    @PostMapping(value = "/ocr/verify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<OcrResponse> verify(@RequestPart("file") MultipartFile file);
}
