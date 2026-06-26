package com.example.paymentservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentOrderResponse {

    private Long paymentId;
    private String razorpayOrderId;
    private String razorpayKeyId;
    private Long amountInPaise;
    private BigDecimal totalAmount;
    private String currency;

}
