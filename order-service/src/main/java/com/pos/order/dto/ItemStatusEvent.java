package com.pos.order.dto;

import com.pos.order.enums.ItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload pushed over /topic/kitchen and /topic/waiter. Carries enough
 * context (orderId, tableId) that the frontend doesn't need a follow-up
 * REST call just to know which table/order an update belongs to.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemStatusEvent {

    private Long orderId;
    private Long tableId;
    private Long itemId;
    private Long menuItemId;
    private String itemNameSnapshot;
    private Integer quantity;
    private ItemStatus status;

}