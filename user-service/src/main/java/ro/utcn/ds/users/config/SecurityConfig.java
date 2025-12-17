package ro.utcn.ds.users.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain api(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());

        http.authorizeHttpRequests(auth -> auth
                // creat user (intern)
                .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                // restul lăsăm liber — Traefik deja a verificat și a pus headere
                .anyRequest().permitAll()
        );

        return http.build();
    }
}
