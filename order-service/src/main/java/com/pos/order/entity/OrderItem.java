package com.pos.order.entity;

import com.pos.order.enums.ItemStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude
    private Order order;

    @Column(nullable = false)
    private Long menuItemId;

    // snapshot fields - populated via Feign call to menu-service at add-time
    @Column(nullable = false)
    private String itemNameSnapshot;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal priceAtOrderTime;
    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal taxRateAtOrderTime;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ItemStatus status = ItemStatus.PENDING;

}
