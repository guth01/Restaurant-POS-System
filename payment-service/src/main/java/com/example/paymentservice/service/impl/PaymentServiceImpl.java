package com.example.paymentservice.service.impl;

import com.example.paymentservice.client.OrderClientResponse;
import com.example.paymentservice.client.OrderItemClientResponse;
import com.example.paymentservice.client.OrderServiceClient;
import com.example.paymentservice.client.TableServiceClient;
import com.example.paymentservice.dto.CreatePaymentOrderRequest;
import com.example.paymentservice.dto.CreatePaymentOrderResponse;
import com.example.paymentservice.dto.PaymentResponse;
import com.example.paymentservice.dto.VerifyPaymentRequest;
import com.example.paymentservice.entity.Payment;
import com.example.paymentservice.enums.PaymentStatus;
import com.example.paymentservice.exception.InvalidOrderStateException;
import com.example.paymentservice.exception.InvalidSignatureException;
import com.example.paymentservice.exception.RazorpayOperationException;
import com.example.paymentservice.exception.ResourceNotFoundException;
import com.example.paymentservice.messaging.PaymentEventPublisher;
import com.example.paymentservice.messaging.PaymentSuccessEvent;
import com.example.paymentservice.repository.PaymentRepository;
import com.example.paymentservice.service.PaymentService;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderServiceClient orderServiceClient;
    private final TableServiceClient tableServiceClient;
    private final PaymentEventPublisher paymentEventPublisher;

    @Value("${razorpay.key-id}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret}")
    private String razorpayKeySecret;

    @Override
    @Transactional
    public CreatePaymentOrderResponse createPaymentOrder(CreatePaymentOrderRequest request) {
        Long orderId = request.getOrderId();

        OrderClientResponse order = orderServiceClient.getOrder(orderId);

        if ("CLOSED".equals(order.getStatus())) {
            throw new InvalidOrderStateException("Order " + orderId + " is already CLOSED and paid for");
        }

        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new InvalidOrderStateException("Order " + orderId + " has no items to pay for");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;

        for (OrderItemClientResponse item : order.getItems()) {
            BigDecimal lineSubtotal = item.getPriceAtOrderTime()
                    .multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal lineTax = lineSubtotal
                    .multiply(item.getTaxRateAtOrderTime())
                    .divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);

            subtotal = subtotal.add(lineSubtotal);
            taxAmount = taxAmount.add(lineTax);
        }

        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);
        taxAmount = taxAmount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        // Razorpay wants amount in the smallest currency unit (paise for INR)
        long amountInPaise = totalAmount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();

        String razorpayOrderId = createRazorpayOrder(amountInPaise, orderId);

        Payment payment = Payment.builder()
                .orderId(orderId)
                .tableId(order.getTableId())
                .waiterId(order.getWaiterId())
                .subtotal(subtotal)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .razorpayOrderId(razorpayOrderId)
                .status(PaymentStatus.PENDING)
                .build();

        Payment saved = paymentRepository.save(payment);

        return CreatePaymentOrderResponse.builder()
                .paymentId(saved.getId())
                .razorpayOrderId(razorpayOrderId)
                .razorpayKeyId(razorpayKeyId)
                .amountInPaise(amountInPaise)
                .totalAmount(totalAmount)
                .currency("INR")
                .build();
    }

    @Override
    @Transactional
    public PaymentResponse verifyPayment(VerifyPaymentRequest request) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No payment found for razorpayOrderId: " + request.getRazorpayOrderId()));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            // Idempotent: don't re-verify, re-close, or re-publish on a retry.
            return toResponse(payment);
        }

        boolean isValid = verifySignature(request);

        if (!isValid) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new InvalidSignatureException(
                    "Signature verification failed for razorpayOrderId: " + request.getRazorpayOrderId());
        }

        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setVerifiedAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);

        // Close the order and free the table - both via Feign, forwarding
        // the original caller's JWT (see FeignConfig).
        orderServiceClient.closeOrder(saved.getOrderId());
        tableServiceClient.closeTable(saved.getTableId());

        paymentEventPublisher.publishPaymentSuccess(
                PaymentSuccessEvent.builder()
                        .paymentId(saved.getId())
                        .orderId(saved.getOrderId())
                        .tableId(saved.getTableId())
                        .waiterId(saved.getWaiterId())
                        .waiterEmail("test@example.com")
                        .subtotal(saved.getSubtotal())
                        .taxAmount(saved.getTaxAmount())
                        .totalAmount(saved.getTotalAmount())
                        .razorpayPaymentId(saved.getRazorpayPaymentId())
                        .paidAt(saved.getVerifiedAt())
                        .build()
        );

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));
        return toResponse(payment);
    }

    // ---- helpers ----

    private String createRazorpayOrder(long amountInPaise, Long orderId) {
        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "order_rcpt_" + orderId);
            orderRequest.put("payment_capture", 1);

            com.razorpay.Order razorpayOrder = client.orders.create(orderRequest);
            return razorpayOrder.get("id");
        } catch (RazorpayException e) {
            throw new RazorpayOperationException("Failed to create Razorpay order: " + e.getMessage(), e);
        }
    }

    private boolean verifySignature(VerifyPaymentRequest request) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.getRazorpayOrderId());
            options.put("razorpay_payment_id", request.getRazorpayPaymentId());
            options.put("razorpay_signature", request.getRazorpaySignature());

            return Utils.verifyPaymentSignature(options, razorpayKeySecret);
        } catch (RazorpayException e) {
            throw new RazorpayOperationException("Signature verification threw an error: " + e.getMessage(), e);
        }
    }

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .tableId(payment.getTableId())
                .subtotal(payment.getSubtotal())
                .taxAmount(payment.getTaxAmount())
                .totalAmount(payment.getTotalAmount())
                .razorpayOrderId(payment.getRazorpayOrderId())
                .razorpayPaymentId(payment.getRazorpayPaymentId())
                .status(payment.getStatus())
                .createdAt(payment.getCreatedAt())
                .verifiedAt(payment.getVerifiedAt())
                .build();
    }

}