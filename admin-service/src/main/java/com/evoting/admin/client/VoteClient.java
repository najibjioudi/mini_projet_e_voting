package com.evoting.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.Map;

@FeignClient(name = "VOTE-SERVICE")
public interface VoteClient {
    @GetMapping("/vote/{electionId}/tally")
    Map<Integer, Long> getTally(@PathVariable("electionId") Integer electionId);
}
