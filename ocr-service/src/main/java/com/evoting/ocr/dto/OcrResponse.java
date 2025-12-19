package com.evoting.ocr.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OcrResponse {
    private String extractedText;
    private float confidence;
    private String extractedCin;
    private String extractedName;
    private String extractedDob;
}
