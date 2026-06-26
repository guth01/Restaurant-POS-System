package com.pos.order.service;

import com.pos.order.dto.AddItemRequest;
import com.pos.order.dto.OrderItemResponse;
import com.pos.order.dto.OrderResponse;
import com.pos.order.enums.ItemStatus;

import java.util.List;

public interface OrderService {

    OrderResponse createOrder(Long tableId, Long waiterId);

    OrderResponse getOrder(Long orderId);

    List<OrderResponse> getOrdersByTable(Long tableId);

    OrderItemResponse addItem(Long orderId, AddItemRequest request);

    OrderItemResponse updateItemStatus(Long itemId, ItemStatus newStatus);

    OrderResponse closeOrder(Long orderId);

}