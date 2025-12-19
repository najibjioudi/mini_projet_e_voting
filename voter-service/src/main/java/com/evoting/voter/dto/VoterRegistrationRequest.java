package com.evoting.voter.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class VoterRegistrationRequest {
    private String cin;
    private String firstName;
    private String lastName;
    private LocalDate dob;
    // Images are passed as MultipartFile separately
}
