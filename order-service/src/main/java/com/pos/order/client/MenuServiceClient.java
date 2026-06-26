package com.pos.order.client;

import com.pos.order.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Calls menu-service to verify a menu item exists/is available and to
 * snapshot its current price (and tax rate, as of Day 3) at order-add time.
 *
 * NOTE: menu-service's CRUD is mounted at /menu-items (confirmed during
 * Day 2 testing).
 */
@FeignClient(name = "menu-service", url = "${menu-service.url}", configuration = FeignConfig.class)
public interface MenuServiceClient {

    @GetMapping("/menu-items/{id}")
    MenuItemResponse getMenuItem(@PathVariable("id") Long id);

}