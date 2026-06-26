package com.pos.notification;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class NotificationServiceApplicationTests {

    @Test
    void contextLoads() {
        // Requires RabbitMQ reachable per application.yml. Mail server
        // connectivity is not checked at startup - JavaMailSender only
        // connects when send() is actually called.
    }

}
