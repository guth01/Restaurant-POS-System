package com.pos.tableservice.config;

import com.pos.tableservice.security.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health").permitAll()
                        // Reads: any authenticated role
                        .requestMatchers(HttpMethod.GET, "/tables/**").authenticated()
                        // Creating/deleting the physical table layout: ADMIN only
                        .requestMatchers(HttpMethod.POST, "/tables").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/tables/**").hasRole("ADMIN")
                        // Day-to-day status changes (open/bill/close): WAITER or ADMIN
                        .requestMatchers(HttpMethod.PUT, "/tables/**").hasAnyRole("WAITER", "ADMIN")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
