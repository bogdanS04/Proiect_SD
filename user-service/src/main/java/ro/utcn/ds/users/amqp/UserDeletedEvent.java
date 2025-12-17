package ro.utcn.ds.users.amqp;

public record UserDeletedEvent(Long user_id, Long auth_id) {
}
