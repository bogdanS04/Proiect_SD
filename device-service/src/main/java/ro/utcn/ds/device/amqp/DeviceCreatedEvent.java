package ro.utcn.ds.device.amqp;

public record DeviceCreatedEvent(String device_id, String user_id, String name) {
}
