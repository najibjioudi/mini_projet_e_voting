package com.evoting.vote.dto;

import lombok.Data;

@Data
public class VoteRequest {
    private Integer electionId;
    private Integer candidateId;
}
