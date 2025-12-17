package ro.utcn.ds.monitoring.amqp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ro.utcn.ds.monitoring.amqp.dto.DeviceCreated;
import ro.utcn.ds.monitoring.amqp.dto.UserCreated;
import ro.utcn.ds.monitoring.domain.Device;
import ro.utcn.ds.monitoring.domain.User;
import ro.utcn.ds.monitoring.repo.DeviceRepository;
import ro.utcn.ds.monitoring.repo.UserRepository;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@RabbitListener(queues = "${app.sync-queue:monitoring.sync}")
@Slf4j
public class SyncConsumer {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;

    @RabbitHandler
    @Transactional
    public void onUser(UserCreated event) {
        log.debug("Sync user.created id={} email={}", event.user_id(), event.email());
        userRepository.save(User.builder()
                .id(event.user_id())
                .email(event.email())
                .createdAt(Optional.ofNullable(event.created_at()).orElse(Instant.now()))
                .build());
    }

    @RabbitHandler
    @Transactional
    public void onDevice(DeviceCreated event) {
        log.debug("Sync device.created id={} userId={} name={}", event.device_id(), event.user_id(), event.name());
        deviceRepository.save(Device.builder()
                .id(event.device_id())
                .userId(event.user_id())
                .name(event.name())
                .build());
    }
}
