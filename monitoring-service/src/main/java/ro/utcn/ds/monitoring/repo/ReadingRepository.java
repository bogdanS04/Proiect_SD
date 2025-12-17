package ro.utcn.ds.monitoring.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.utcn.ds.monitoring.domain.Reading;

public interface ReadingRepository extends JpaRepository<Reading, Long> {
}
