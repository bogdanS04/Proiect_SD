package ro.utcn.ds.device.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ro.utcn.ds.device.model.SyncedUser;

public interface SyncedUserRepository extends JpaRepository<SyncedUser, Long> {
    void deleteByAuthId(Long authId);
}
