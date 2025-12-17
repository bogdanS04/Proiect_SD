package ro.utcn.ds.device.amqp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.utcn.ds.device.model.SyncedUser;
import ro.utcn.ds.device.repo.DeviceRepository;
import ro.utcn.ds.device.repo.SyncedUserRepository;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
@RabbitListener(queues = AmqpConfig.SYNC_QUEUE)
public class SyncConsumer {

    private final DeviceRepository deviceRepository;
    private final SyncedUserRepository syncedUserRepository;

    @RabbitHandler
    @Transactional
    public void onUserCreated(UserCreatedEvent evt) {
        if (evt.auth_id() == null && evt.user_id() == null) {
            log.warn("Received user.created without auth/user id");
            return;
        }
        Long authId = evt.auth_id() != null ? evt.auth_id() : evt.user_id();
        syncedUserRepository.save(SyncedUser.builder()
                .id(authId)          // păstrăm doar identificatorul
                .authId(authId)
                .email(null)         // nu mai persistăm atributele opționale
                .createdAt(null)
                .build());
        log.debug("Synced user.created authId={}", authId);
    }

    @RabbitHandler
    @Transactional
    public void onUserDeleted(UserDeletedEvent evt) {
        if (evt.auth_id() == null) {
            log.warn("Received user.deleted without auth_id, skipping");
            return;
        }
        long count = deviceRepository.deleteByUserAuthId(evt.auth_id());
        syncedUserRepository.deleteByAuthId(evt.auth_id());
        log.info("user.deleted auth_id={} -> deleted {} devices", evt.auth_id(), count);
    }
}
