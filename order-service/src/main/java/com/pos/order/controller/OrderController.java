package com.pos.order.controller;

import com.pos.order.dto.AddItemRequest;
import com.pos.order.dto.CreateOrderRequest;
import com.pos.order.dto.OrderItemResponse;
import com.pos.order.dto.OrderResponse;
import com.pos.order.dto.UpdateItemStatusRequest;
import com.pos.order.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('WAITER','ADMIN')")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request,
                                                     HttpServletRequest httpRequest) {
        Long waiterId = (Long) httpRequest.getAttribute("userId");
        OrderResponse response = orderService.createOrder(request.getTableId(), waiterId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('WAITER','ADMIN','KITCHEN')")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }

    @GetMapping("/table/{tableId}")
    @PreAuthorize("hasAnyRole('WAITER','ADMIN','KITCHEN')")
    public ResponseEntity<List<OrderResponse>> getOrdersByTable(@PathVariable Long tableId) {
        return ResponseEntity.ok(orderService.getOrdersByTable(tableId));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('WAITER','ADMIN')")
    public ResponseEntity<OrderItemResponse> addItem(@PathVariable Long id,
                                                     @Valid @RequestBody AddItemRequest request) {
        OrderItemResponse response = orderService.addItem(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/items/{itemId}/status")
    @PreAuthorize("hasAnyRole('KITCHEN','ADMIN')")
    public ResponseEntity<OrderItemResponse> updateItemStatus(@PathVariable Long itemId,
                                                              @Valid @RequestBody UpdateItemStatusRequest request) {
        OrderItemResponse response = orderService.updateItemStatus(itemId, request.getStatus());
        return ResponseEntity.ok(response);
    }

    // Called by payment-service (via Feign, forwarding the original caller's
    // JWT) once a payment is verified SUCCESS. No request body - this is a
    // pure state transition, same pattern as table-service's /open, /bill,
    // /close endpoints.
    @PutMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('WAITER','ADMIN')")
    public ResponseEntity<OrderResponse> closeOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.closeOrder(id));
    }

}