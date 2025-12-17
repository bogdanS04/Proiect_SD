package ro.utcn.ds.monitoring.repo;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ro.utcn.ds.monitoring.domain.HourlyConsumption;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface HourlyConsumptionRepository extends JpaRepository<HourlyConsumption, Long> {

    List<HourlyConsumption> findByDeviceIdAndHourStartBetweenOrderByHourStartAsc(String deviceId, Instant from, Instant to);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select hc from HourlyConsumption hc where hc.deviceId = :deviceId and hc.hourStart = :hourStart")
    Optional<HourlyConsumption> findLocked(@Param("deviceId") String deviceId, @Param("hourStart") Instant hourStart);
}
