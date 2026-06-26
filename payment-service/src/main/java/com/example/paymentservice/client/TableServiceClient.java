package com.example.paymentservice.client;

import com.example.paymentservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

/**
 * NOTE: assumes table-service's existing state-machine endpoint is
 * PUT /tables/{id}/close, transitioning BILLED -> AVAILABLE per the Day 1
 * spec (AVAILABLE -> OCCUPIED -> BILLED -> AVAILABLE). I haven't seen
 * table-service's actual controller, so confirm this path and method name
 * match before relying on it - if table-service's real endpoint differs
 * (e.g. a different verb or a body payload), update this interface to match.
 */
@FeignClient(name = "table-service", url = "${table-service.url}", configuration = FeignConfig.class)
public interface TableServiceClient {

    @PutMapping("/tables/{id}/close")
    TableClientResponse closeTable(@PathVariable("id") Long id);

}