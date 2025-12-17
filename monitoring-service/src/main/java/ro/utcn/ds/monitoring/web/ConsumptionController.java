package ro.utcn.ds.monitoring.web;

import com.fasterxml.jackson.annotation.JsonProperty;
import ro.utcn.ds.monitoring.domain.HourlyConsumption;
import ro.utcn.ds.monitoring.repo.HourlyConsumptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.*;

@RestController
@RequestMapping("/api/consumption")
@RequiredArgsConstructor
public class ConsumptionController {
    private final HourlyConsumptionRepository repo;
    public record HourPoint(@JsonProperty("hour") int hour, @JsonProperty("kwh") BigDecimal kwh) {}

    @GetMapping("/day")
    public List<HourPoint> byDay(@RequestParam("deviceId") String deviceId,
                                 @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        ZonedDateTime start = date.atStartOfDay(ZoneOffset.UTC);
        ZonedDateTime end = start.plusDays(1);
        var rows = repo.findByDeviceIdAndHourStartBetweenOrderByHourStartAsc(deviceId, start.toInstant(), end.toInstant());
        Map<Integer, BigDecimal> map = rows.stream().collect(Collectors.toMap(
                r -> (int) Duration.between(start.toInstant(), r.getHourStart()).toHours(),
                HourlyConsumption::getTotalKwh));
        return IntStream.range(0,24).mapToObj(h -> new HourPoint(h, map.getOrDefault(h, BigDecimal.ZERO))).toList();
    }
}
