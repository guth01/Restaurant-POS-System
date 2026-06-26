package com.example.paymentservice.messaging;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Published to RabbitMQ on PaymentStatus.SUCCESS. notification-service
 * mirrors this exact shape on its consuming side.
 *
 * NOTE on waiterId: there's no customer email/phone anywhere in this
 * system's data model (auth-service only has staff accounts), so the
 * "receipt email" in the Day 3 plan can only realistically go to the
 * waiter who served the table, not an actual customer. notification-service
 * resolves waiterId -> email via a Feign call to auth-service. If you want
 * real customer receipts later, you'd need to add a customer email/phone
 * field at order-creation time first - that's a data model change, not
 * something notification-service can work around on its own.
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
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String razorpayPaymentId;
    private LocalDateTime paidAt;
    private String waiterEmail;

}