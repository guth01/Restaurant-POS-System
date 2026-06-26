package com.pos.order.dto;

import com.pos.order.enums.ItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {

    private Long id;
    private Long menuItemId;
    private String itemNameSnapshot;
    private BigDecimal priceAtOrderTime;
    private BigDecimal taxRateAtOrderTime;
    private Integer quantity;
    private ItemStatus status;

}