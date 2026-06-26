package com.pos.notification.service.impl;

import com.pos.notification.dto.PaymentSuccessEvent;
import com.pos.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final JavaMailSender mailSender;

    @Value("${notification.mail.from}")
    private String fromAddress;

    private static final DateTimeFormatter TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    @Override
    @Async
    public void sendReceiptEmail(PaymentSuccessEvent event) {
        if (event.getWaiterEmail() == null || event.getWaiterEmail().isBlank()) {
            // Don't throw - there's no HTTP caller waiting on this, throwing
            // just gets swallowed/logged by the RabbitMQ listener container.
            // Log loudly instead so it's visible in ops, and skip sending
            // rather than NPE-ing on a null recipient.
            log.error("PaymentSuccessEvent for paymentId={} has no waiterEmail - " +
                    "payment-service should have resolved this before publishing. Skipping email.",
                    event.getPaymentId());
            return;
        }

        try {
            SimpleMailMessage message = buildReceiptMessage(event);
            mailSender.send(message);
            log.info("Receipt email sent for paymentId={} to {}", event.getPaymentId(), event.getWaiterEmail());
        } catch (Exception e) {
            // Fire-and-forget per the Day 3 plan - log and move on rather
            // than retrying indefinitely. If you need guaranteed delivery,
            // add a dead-letter queue + retry policy instead of catching here.
            log.error("Failed to send receipt email for paymentId={}: {}",
                    event.getPaymentId(), e.getMessage(), e);
        }
    }

    private SimpleMailMessage buildReceiptMessage(PaymentSuccessEvent event) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(event.getWaiterEmail());
        message.setSubject("Payment Receipt - Order #" + event.getOrderId());

        String paidAt = event.getPaidAt() != null ? event.getPaidAt().format(TIMESTAMP_FORMAT) : "N/A";

        String body = String.format(
                "Payment received for Table %d, Order #%d.%n%n" +
                "Subtotal: Rs. %s%n" +
                "Tax: Rs. %s%n" +
                "Total Paid: Rs. %s%n%n" +
                "Razorpay Payment ID: %s%n" +
                "Paid at: %s%n%n" +
                "-- Restaurant POS",
                event.getTableId(),
                event.getOrderId(),
                event.getSubtotal(),
                event.getTaxAmount(),
                event.getTotalAmount(),
                event.getRazorpayPaymentId(),
                paidAt
        );

        message.setText(body);
        return message;
    }

}
