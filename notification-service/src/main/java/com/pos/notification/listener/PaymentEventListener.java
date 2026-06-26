package com.pos.notification.listener;

import com.pos.notification.config.RabbitMQConfig;
import com.pos.notification.dto.PaymentSuccessEvent;
import com.pos.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventListener {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.PAYMENT_SUCCESS_QUEUE)
    public void handlePaymentSuccess(PaymentSuccessEvent event) {
        log.info("Received payment-success event for paymentId={}, orderId={}",
                event.getPaymentId(), event.getOrderId());

        // sendReceiptEmail is @Async, so this listener method returns (and
        // the message gets ack'd) without waiting on the SMTP round-trip.
        notificationService.sendReceiptEmail(event);
    }

}
