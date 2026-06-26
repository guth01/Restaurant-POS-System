package com.pos.order.repository;

import com.pos.order.entity.Order;
import com.pos.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByTableId(Long tableId);

    List<Order> findByStatus(OrderStatus status);

}
