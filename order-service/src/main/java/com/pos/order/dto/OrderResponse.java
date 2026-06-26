package com.pos.order.dto;

import com.pos.order.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private Long tableId;
    private Long waiterId;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;

}
