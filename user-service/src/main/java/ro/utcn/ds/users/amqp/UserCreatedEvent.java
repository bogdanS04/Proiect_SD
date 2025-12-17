package ro.utcn.ds.users.amqp;

import java.time.Instant;

public record UserCreatedEvent(Long user_id, Long auth_id, String email, Instant created_at) {
}
