package ro.utcn.ds.monitoring.amqp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UserCreated(
        String user_id,
        String auth_id,
        String email,
        Instant created_at
) {
}
