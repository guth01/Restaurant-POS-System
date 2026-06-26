package com.example.paymentservice.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableClientResponse {

    private Long id;
    private Integer tableNumber;
    private String status;

}
