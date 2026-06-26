package com.pos.order.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP-over-WebSocket setup. Two broadcast channels:
 *   /topic/kitchen - every order_item status change (kitchen display)
 *   /topic/waiter  - only fires when an item becomes READY (waiter terminal)
 *
 * Clients connect to ws://localhost:8084/ws (SockJS fallback included for
 * browsers/networks that block raw WebSocket), then subscribe to the topic
 * they care about. No STOMP-level auth is enforced here - same "per-service,
 * keep it simple" philosophy as the rest of Day 2/3, since this is a read-only
 * broadcast channel with no sensitive write path. Revisit if that changes.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

}