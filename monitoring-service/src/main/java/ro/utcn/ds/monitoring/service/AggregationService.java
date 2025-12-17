package ro.utcn.ds.monitoring.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.utcn.ds.monitoring.domain.HourlyConsumption;
import ro.utcn.ds.monitoring.repo.HourlyConsumptionRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AggregationService {

    private final HourlyConsumptionRepository hourlyConsumptionRepository;

    @Transactional
    public BigDecimal addTenMinuteSample(String deviceId, Instant timestamp, BigDecimal measurementValue) {
        Instant hourStart = timestamp.truncatedTo(ChronoUnit.HOURS);

        HourlyConsumption hourly = hourlyConsumptionRepository.findLocked(deviceId, hourStart)
                .orElseGet(() -> HourlyConsumption.builder()
                        .deviceId(deviceId)
                        .hourStart(hourStart)
                        .totalKwh(BigDecimal.ZERO)
                        .build());

        hourly.setTotalKwh(hourly.getTotalKwh().add(measurementValue));
        hourlyConsumptionRepository.save(hourly);
        return hourly.getTotalKwh();
    }
}
