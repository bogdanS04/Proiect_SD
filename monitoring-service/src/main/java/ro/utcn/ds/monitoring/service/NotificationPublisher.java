package ro.utcn.ds.monitoring.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import ro.utcn.ds.monitoring.repo.DeviceRepository;

import java.math.BigDecimal;
import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final DeviceRepository deviceRepository;

    @Value("${app.ws-exchange:ems.ws}")
    private String wsExchange;

    public void publishOverconsumption(String deviceId, BigDecimal readingKwh, BigDecimal hourlyTotalKwh,
                                       BigDecimal limitKwh, Instant timestamp) {
        deviceRepository.findById(deviceId).ifPresentOrElse(device -> {
            OverconsumptionPayload payload = new OverconsumptionPayload(
                    deviceId,
                    device.getUserId(),
                    readingKwh,
                    hourlyTotalKwh,
                    limitKwh,
                    timestamp
            );
            WsEvent event = new WsEvent(
                    "notification",
                    device.getUserId(),
                    new String[]{"user", "admin"},
                    payload
            );
            rabbitTemplate.convertAndSend(wsExchange, "notify.overconsumption", event);
            log.debug("Published overconsumption notification for device={} user={}", deviceId, device.getUserId());
        }, () -> log.warn("Skip overconsumption notification, unknown device {}", deviceId));
    }

    public record OverconsumptionPayload(
            String deviceId,
            String userId,
            BigDecimal readingKwh,
            BigDecimal hourlyTotalKwh,
            BigDecimal limitKwh,
            Instant timestamp
    ) {}

    public record WsEvent(
            String type,
            String targetUserId,
            String[] audience,
            Object payload
    ) {}
}
