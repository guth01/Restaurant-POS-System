package com.example.paymentservice.service;

import com.example.paymentservice.dto.CreatePaymentOrderRequest;
import com.example.paymentservice.dto.CreatePaymentOrderResponse;
import com.example.paymentservice.dto.PaymentResponse;
import com.example.paymentservice.dto.VerifyPaymentRequest;

public interface PaymentService {

    CreatePaymentOrderResponse createPaymentOrder(CreatePaymentOrderRequest request);

    PaymentResponse verifyPayment(VerifyPaymentRequest request);

    PaymentResponse getPayment(Long paymentId);

}