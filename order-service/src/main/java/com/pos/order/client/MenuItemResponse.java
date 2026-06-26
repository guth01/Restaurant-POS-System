package com.pos.order.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Mirrors menu-service's MenuItemResponse shape.
 * If menu-service's actual response DTO has different/extra fields,
 * update this to match exactly - Feign deserializes by field name.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private BigDecimal taxRate;
    private Boolean isAvailable;
    private Integer prepTimeMinutes;

}
