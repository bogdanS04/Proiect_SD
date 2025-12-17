package ro.utcn.ds.device.amqp;

public record UserDeletedEvent(Long user_id, Long auth_id) {
}
