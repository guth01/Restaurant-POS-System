package com.pos.order.config;

import com.pos.order.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/orders").hasAnyRole("WAITER", "ADMIN")
                        // add item to order - WAITER or ADMIN
                        .requestMatchers(HttpMethod.POST, "/orders/*/items").hasAnyRole("WAITER", "ADMIN")
                        // update item status - KITCHEN or ADMIN
                        .requestMatchers(HttpMethod.PUT, "/orders/items/*/status").hasAnyRole("KITCHEN", "ADMIN")
                        // close order (called by payment-service post-payment) - WAITER or ADMIN
                        .requestMatchers(HttpMethod.PUT, "/orders/*/close").hasAnyRole("WAITER", "ADMIN")
                        // reads - any authenticated role
                        .requestMatchers(HttpMethod.GET, "/orders/**").hasAnyRole("WAITER", "ADMIN", "KITCHEN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}