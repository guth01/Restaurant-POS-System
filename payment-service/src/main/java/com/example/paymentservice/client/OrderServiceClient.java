package com.example.paymentservice.client;

import com.example.paymentservice.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

@FeignClient(name = "order-service", url = "${order-service.url}", configuration = FeignConfig.class)
public interface OrderServiceClient {

    @GetMapping("/orders/{id}")
    com.example.paymentservice.client.OrderClientResponse getOrder(@PathVariable("id") Long id);

    @PutMapping("/orders/{id}/close")
    com.example.paymentservice.client.OrderClientResponse closeOrder(@PathVariable("id") Long id);

}