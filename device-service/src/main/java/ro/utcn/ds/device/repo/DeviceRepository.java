package ro.utcn.ds.device.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.utcn.ds.device.model.Device;
import java.util.List;

public interface DeviceRepository extends JpaRepository<Device, Long> {
    List<Device> findByUserAuthId(Long userAuthId);
    long deleteByUserAuthId(Long userAuthId);
}
