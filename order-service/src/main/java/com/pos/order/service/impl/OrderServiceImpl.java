package com.pos.order.service.impl;

import com.pos.order.client.MenuItemResponse;
import com.pos.order.client.MenuServiceClient;
import com.pos.order.dto.AddItemRequest;
import com.pos.order.dto.ItemStatusEvent;
import com.pos.order.dto.OrderItemResponse;
import com.pos.order.dto.OrderResponse;
import com.pos.order.entity.Order;
import com.pos.order.entity.OrderItem;
import com.pos.order.enums.ItemStatus;
import com.pos.order.enums.OrderStatus;
import com.pos.order.exception.InvalidMenuItemException;
import com.pos.order.exception.InvalidOrderStateException;
import com.pos.order.exception.ResourceNotFoundException;
import com.pos.order.repository.OrderItemRepository;
import com.pos.order.repository.OrderRepository;
import com.pos.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final String KITCHEN_TOPIC = "/topic/kitchen";
    private static final String WAITER_TOPIC = "/topic/waiter";

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuServiceClient menuServiceClient;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public OrderResponse createOrder(Long tableId, Long waiterId) {
        Order order = Order.builder()
                .tableId(tableId)
                .waiterId(waiterId)
                .status(OrderStatus.OPEN)
                .build();

        Order saved = orderRepository.save(order);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId) {
        Order order = findOrderOrThrow(orderId);
        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByTable(Long tableId) {
        return orderRepository.findByTableId(tableId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderItemResponse addItem(Long orderId, AddItemRequest request) {
        Order order = findOrderOrThrow(orderId);

        // Live Feign verification against menu-service: existence + availability,
        // and snapshot the price/name at this moment in time.
        MenuItemResponse menuItem = verifyMenuItem(request.getMenuItemId());

        OrderItem item = OrderItem.builder()
                .order(order)
                .menuItemId(menuItem.getId())
                .itemNameSnapshot(menuItem.getName())
                .priceAtOrderTime(menuItem.getPrice())
                .taxRateAtOrderTime(menuItem.getTaxRate())
                .quantity(request.getQuantity())
                .status(ItemStatus.PENDING)
                .build();

        OrderItem saved = orderItemRepository.save(item);
        broadcastItemEvent(saved, KITCHEN_TOPIC);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public OrderItemResponse updateItemStatus(Long itemId, ItemStatus newStatus) {
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found with id: " + itemId));

        item.setStatus(newStatus);
        OrderItem saved = orderItemRepository.save(item);

        // Every status change goes to the kitchen display channel.
        broadcastItemEvent(saved, KITCHEN_TOPIC);

        // READY specifically also notifies the waiter terminal - that's the
        // signal "food's up, go grab it for the table."
        if (newStatus == ItemStatus.READY) {
            broadcastItemEvent(saved, WAITER_TOPIC);
        }

        return toResponse(saved);
    }

    @Override
    @Transactional
    public OrderResponse closeOrder(Long orderId) {
        Order order = findOrderOrThrow(orderId);

        if (order.getStatus() == OrderStatus.CLOSED) {
            // Idempotent: payment-service may retry this call (e.g. webhook
            // redelivery), so don't throw on a second close - just return
            // the already-closed order.
            return toResponse(order);
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new InvalidOrderStateException(
                    "Order " + orderId + " is CANCELLED and cannot be closed");
        }

        order.setStatus(OrderStatus.CLOSED);
        Order saved = orderRepository.save(order);
        return toResponse(saved);
    }

    // ---- helpers ----

    private Order findOrderOrThrow(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
    }

    private void broadcastItemEvent(OrderItem item, String topic) {
        ItemStatusEvent event = ItemStatusEvent.builder()
                .orderId(item.getOrder().getId())
                .tableId(item.getOrder().getTableId())
                .itemId(item.getId())
                .menuItemId(item.getMenuItemId())
                .itemNameSnapshot(item.getItemNameSnapshot())
                .quantity(item.getQuantity())
                .status(item.getStatus())
                .build();

        messagingTemplate.convertAndSend(topic, event);
    }

    private MenuItemResponse verifyMenuItem(Long menuItemId) {
        MenuItemResponse menuItem;
        try {
            menuItem = menuServiceClient.getMenuItem(menuItemId);
        } catch (feign.FeignException.NotFound e) {
            throw new InvalidMenuItemException("Menu item does not exist: " + menuItemId);
        }

        if (menuItem == null) {
            throw new InvalidMenuItemException("Menu item does not exist: " + menuItemId);
        }

        if (Boolean.FALSE.equals(menuItem.getIsAvailable())) {
            throw new InvalidMenuItemException(
                    "Menu item '" + menuItem.getName() + "' is currently unavailable");
        }

        return menuItem;
    }

    private OrderResponse toResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .tableId(order.getTableId())
                .waiterId(order.getWaiterId())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .items(order.getItems() == null ? List.of() :
                        order.getItems().stream().map(this::toResponse).collect(Collectors.toList()))
                .build();
    }

    private OrderItemResponse toResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .menuItemId(item.getMenuItemId())
                .itemNameSnapshot(item.getItemNameSnapshot())
                .priceAtOrderTime(item.getPriceAtOrderTime())
                .taxRateAtOrderTime(item.getTaxRateAtOrderTime())
                .quantity(item.getQuantity())
                .status(item.getStatus())
                .build();
    }

}