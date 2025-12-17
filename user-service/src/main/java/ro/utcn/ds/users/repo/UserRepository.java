package ro.utcn.ds.users.repo;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import ro.utcn.ds.users.model.AppUser;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    boolean existsByUsername(String username);
}
