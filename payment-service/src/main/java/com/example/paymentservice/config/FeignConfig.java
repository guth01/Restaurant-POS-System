package com.example.paymentservice.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Same pattern as order-service's FeignConfig (introduced Day 2). Forwards
 * the original caller's JWT onto outbound Feign calls to order-service and
 * table-service, since both require auth on every endpoint.
 *
 * Important nuance for payment-service specifically: the /payments/verify
 * endpoint is assumed to be called by the frontend (still carrying the
 * waiter's JWT) right after the Razorpay checkout redirect completes - NOT
 * by a server-to-server Razorpay webhook with no JWT at all. If you later
 * add a real Razorpay webhook listener, that path won't have a user JWT to
 * forward and will need a separate service-account/service-to-service auth
 * strategy instead of this interceptor.
 */
@Configuration
public class FeignConfig {

    private static final String AUTH_HEADER = "Authorization";

    @Bean
    public RequestInterceptor authForwardingInterceptor() {
        return (RequestTemplate template) -> {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String token = request.getHeader(AUTH_HEADER);
                if (token != null) {
                    template.header(AUTH_HEADER, token);
                }
            }
        };
    }

}