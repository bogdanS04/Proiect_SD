package ro.utcn.ds.monitoring.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.utcn.ds.monitoring.domain.User;

public interface UserRepository extends JpaRepository<User, String> {
}
