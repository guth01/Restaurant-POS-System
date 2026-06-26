package com.pos.notification.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Mirrors payment-service's RabbitMQConfig exactly (same exchange name,
 * queue name, routing key). RabbitMQ's declarations are idempotent, so it
 * doesn't matter which service starts first - whichever connects first
 * creates the exchange/queue/binding, the other just confirms they already
 * match.
 */
@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "pos.events.exchange";
    public static final String PAYMENT_SUCCESS_QUEUE = "notification.payment-success.queue";
    public static final String PAYMENT_SUCCESS_ROUTING_KEY = "payment.success";

    @Bean
    public TopicExchange posEventsExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public Queue paymentSuccessQueue() {
        return new Queue(PAYMENT_SUCCESS_QUEUE, true);
    }

    @Bean
    public Binding paymentSuccessBinding(Queue paymentSuccessQueue, TopicExchange posEventsExchange) {
        return BindingBuilder.bind(paymentSuccessQueue)
                .to(posEventsExchange)
                .with(PAYMENT_SUCCESS_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

}
