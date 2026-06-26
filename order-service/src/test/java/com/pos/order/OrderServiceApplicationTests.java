package com.pos.order;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class OrderServiceApplicationTests {

    @Test
    void contextLoads() {
        // Sanity check - app context should start cleanly.
        // Requires a reachable MySQL instance per application.yml,
        // or swap to an H2 test profile if you want this to run without MySQL.
    }

}
