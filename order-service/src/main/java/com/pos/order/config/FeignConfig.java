package com.pos.order.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Forwards the original caller's JWT onto outbound Feign calls.
 * menu-service (and now table-service, via payment-service) requires a
 * valid JWT on every endpoint, including reads - without this, downstream
 * Feign calls get 401'd because the Authorization header is dropped by
 * default. Explicitly referenced via configuration = FeignConfig.class on
 * each @FeignClient rather than relying on Spring Cloud OpenFeign's implicit
 * global-bean behavior.
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