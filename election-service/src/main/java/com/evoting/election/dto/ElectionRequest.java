package com.evoting.election.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class ElectionRequest {
    private String title;
    private String description;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Set<Integer> candidateIds;
}
