package com.pos.order.dto;

import com.pos.order.enums.ItemStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateItemStatusRequest {

    @NotNull(message = "status is required")
    private ItemStatus status;

}
