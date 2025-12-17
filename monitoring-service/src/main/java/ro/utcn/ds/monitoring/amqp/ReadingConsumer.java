package ro.utcn.ds.monitoring.amqp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ro.utcn.ds.monitoring.amqp.dto.ReadingMsg;
import ro.utcn.ds.monitoring.domain.Reading;
import ro.utcn.ds.monitoring.repo.ReadingRepository;
import ro.utcn.ds.monitoring.service.AggregationService;
import ro.utcn.ds.monitoring.service.NotificationPublisher;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReadingConsumer {

    private final AggregationService aggregationService;
    private final ReadingRepository readingRepository;
    private final NotificationPublisher notificationPublisher;

    @Value("${app.over-limit-kwh:0.5}")
    private BigDecimal overLimit;

    @RabbitListener(queues = "${app.ingest-queue:monitoring.ingest.1}")
    public void onReading(ReadingMsg message) {
        log.debug("Reading received rk=device.{}.reading ts={} kwh={}", message.device_id(), message.timestamp(), message.measurement_value());
        readingRepository.save(
                Reading.builder()
                        .deviceId(message.device_id())
                        .timestamp(message.timestamp())
                        .measurementValue(message.measurement_value())
                        .build()
        );

        BigDecimal hourlyTotal = aggregationService.addTenMinuteSample(
                message.device_id(),
                message.timestamp(),
                message.measurement_value()
        );

        try {
            if (overLimit != null &&
                    (message.measurement_value().compareTo(overLimit) > 0
                            || hourlyTotal.compareTo(overLimit) > 0)) {
                notificationPublisher.publishOverconsumption(
                        message.device_id(),
                        message.measurement_value(),
                        hourlyTotal,
                        overLimit,
                        message.timestamp()
                );
            }
        } catch (Exception ex) {
            log.warn("Failed to publish overconsumption notification: {}", ex.getMessage());
        }
    }
}
