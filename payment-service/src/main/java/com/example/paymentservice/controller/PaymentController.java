package com.example.paymentservice.controller;

import com.example.paymentservice.dto.CreatePaymentOrderRequest;
import com.example.paymentservice.dto.CreatePaymentOrderResponse;
import com.example.paymentservice.dto.PaymentResponse;
import com.example.paymentservice.dto.VerifyPaymentRequest;
import com.example.paymentservice.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // Step 1: waiter taps "pay" on a table's order. This creates a Razorpay
    // order server-side and returns what the frontend needs to launch
    // Razorpay Checkout.
    @PostMapping("/create-order")
    @PreAuthorize("hasAnyRole('WAITER','ADMIN')")
    public ResponseEntity<CreatePaymentOrderResponse> createPaymentOrder(
            @Valid @RequestBody CreatePaymentOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createPaymentOrder(request));
    }

    // Step 2: after Razorpay Checkout's success callback fires in the
    // browser, frontend sends the three razorpay_* fields here for
    // server-side signature verification. On success this also closes the
    // order, frees the table, and publishes the payment-success event.
    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('WAITER','ADMIN')")
    public ResponseEntity<PaymentResponse> verifyPayment(@Valid @RequestBody VerifyPaymentRequest request) {
        return ResponseEntity.ok(paymentService.verifyPayment(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('WAITER','ADMIN')")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPayment(id));
    }

}