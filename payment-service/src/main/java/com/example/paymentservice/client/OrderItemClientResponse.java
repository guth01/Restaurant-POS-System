package com.example.paymentservice.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Mirrors order-service's OrderItemResponse. Only the fields payment-service
 * actually needs for total calculation are required to match exactly
 * (priceAtOrderTime, taxRateAtOrderTime, quantity) - if order-service's DTO
 * gains unrelated fields later, Feign just ignores them here.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemClientResponse {

    private Long id;
    private Long menuItemId;
    private String itemNameSnapshot;
    private BigDecimal priceAtOrderTime;
    private BigDecimal taxRateAtOrderTime;
    private Integer quantity;
    private String status;

}