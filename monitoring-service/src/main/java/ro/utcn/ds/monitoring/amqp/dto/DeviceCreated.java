package ro.utcn.ds.monitoring.amqp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DeviceCreated(
        String device_id,
        String user_id,
        String name
) {
}
