package com.pos.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class GatewayApplicationTests {

    @Test
    void contextLoads() {
        // Sanity check - gateway context should start cleanly even with
        // downstream services not running, since routes are lazy-resolved
        // per-request, not validated at startup.
    }

}
