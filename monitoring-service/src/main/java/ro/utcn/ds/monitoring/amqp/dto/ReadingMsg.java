package ro.utcn.ds.monitoring.amqp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ReadingMsg(
        Instant timestamp,
        String device_id,
        BigDecimal measurement_value
) {
}
