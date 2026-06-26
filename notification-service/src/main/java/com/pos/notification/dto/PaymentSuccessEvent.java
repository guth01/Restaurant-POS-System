package com.pos.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Mirrors payment-service's PaymentSuccessEvent. Field names must match
 * exactly - Jackson2JsonMessageConverter deserializes by field name, so any
 * drift here silently produces nulls instead of an error.
 *
 * waiterEmail is the key field this service depends on: payment-service is
 * expected to resolve it (via a Feign call to auth-service, forwarding the
 * caller's JWT from /payments/verify) BEFORE publishing. notification-service
 * has no HTTP request context of its own to forward a token from - it's
 * woken up by a RabbitMQ message, not a user's API call - so it cannot look
 * this email up itself. If waiterEmail arrives null, treat that as a
 * payment-service bug, not something to patch around here.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSuccessEvent {

    private Long paymentId;
    private Long orderId;
    private Long tableId;
    private Long waiterId;
    private String waiterEmail;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String razorpayPaymentId;
    private LocalDateTime paidAt;

}
