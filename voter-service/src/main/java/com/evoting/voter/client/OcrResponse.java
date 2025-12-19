package com.evoting.voter.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrResponse {
    private String extractedText;
    private float confidence;
    private String extractedCin;
    private String extractedName;
    private String extractedDob;
}
