package com.example.paymentservice.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderClientResponse {

    private Long id;
    private Long tableId;
    private Long waiterId;
    private String status;
    private List<OrderItemClientResponse> items;

}