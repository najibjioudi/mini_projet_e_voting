package com.evoting.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@FeignClient(name = "RESULT-SERVICE")
public interface ResultClient {
    @PostMapping("/result/{electionId}/publish")
    void publishResults(@PathVariable("electionId") Integer electionId, @RequestBody Map<Integer, Long> counts);
}
