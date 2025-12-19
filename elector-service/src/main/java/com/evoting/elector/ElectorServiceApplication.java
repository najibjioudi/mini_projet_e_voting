package com.evoting.elector;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ElectorServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ElectorServiceApplication.class, args);
    }

}
