package ro.utcn.ds.monitoring.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.utcn.ds.monitoring.domain.Device;

public interface DeviceRepository extends JpaRepository<Device, String> {
}
