package ro.utcn.ds.device.web;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import ro.utcn.ds.device.model.Device;
import ro.utcn.ds.device.repo.DeviceRepository;
import ro.utcn.ds.device.amqp.AmqpConfig;
import ro.utcn.ds.device.amqp.DeviceCreatedEvent;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceRepository repo;
    private final RabbitTemplate rabbit;

    private boolean isAdmin(HttpServletRequest req) {
        String role = req.getHeader("X-User-Role");
        return "ADMIN".equalsIgnoreCase(role);
    }
    private Long userId(HttpServletRequest req) {
        String s = req.getHeader("X-User-Id");
        try { return s != null ? Long.parseLong(s) : null; } catch (Exception e) { return null; }
    }

    private boolean isOwnerOrAdmin(Device d, Long callerId, boolean admin) {
        return admin || (callerId != null && callerId.equals(d.getUserAuthId()));
    }

    // ADMIN: toate device-urile
    @GetMapping
    public ResponseEntity<?> all(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body("forbidden");
        return ResponseEntity.ok(repo.findAll());
    }

    // ADMIN: create pentru orice user
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Device body, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body("forbidden");
        Device d = repo.save(body);
        publishDeviceCreated(d);
        return ResponseEntity.status(201).body(d);
    }

    // USER: devices proprii
    @GetMapping("/my")
    public ResponseEntity<?> myDevices(HttpServletRequest req) {
        Long uid = userId(req);
        if (uid == null) return ResponseEntity.status(401).body("unauthorized");
        List<Device> list = repo.findByUserAuthId(uid);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/my")
    public ResponseEntity<?> addMy(@RequestBody Device body, HttpServletRequest req) {
        Long uid = userId(req);
        if (uid == null) return ResponseEntity.status(401).body("unauthorized");
        body.setUserAuthId(uid);
        Device d = repo.save(body);
        publishDeviceCreated(d);
        return ResponseEntity.status(201).body(d);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Device body, HttpServletRequest req) {
        Long uid = userId(req);
        boolean admin = isAdmin(req);
        return repo.findById(id).map(dev -> {
            if (!isOwnerOrAdmin(dev, uid, admin)) return ResponseEntity.status(403).body("forbidden");
            if (body.getName() != null) dev.setName(body.getName());
            if (body.getDescription() != null) dev.setDescription(body.getDescription());
            if (body.getStatus() != null) dev.setStatus(body.getStatus());
            if (admin && body.getUserAuthId() != null) dev.setUserAuthId(body.getUserAuthId());
            return ResponseEntity.ok(repo.save(dev));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpServletRequest req) {
        Long uid = userId(req);
        boolean admin = isAdmin(req);
        return repo.findById(id).map(dev -> {
            if (!isOwnerOrAdmin(dev, uid, admin)) return ResponseEntity.status(403).body("forbidden");
            repo.delete(dev);
            return ResponseEntity.noContent().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * ADMIN: șterge toate device-urile unui user (apelat când se șterge userul din user-service).
     */
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<?> deleteByUser(@PathVariable Long userId, HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body("forbidden");
        repo.deleteByUserAuthId(userId);
        return ResponseEntity.noContent().build();
    }

    private void publishDeviceCreated(Device d) {
        try {
            rabbit.convertAndSend(AmqpConfig.SYNC_EXCHANGE, "device.created",
                    new DeviceCreatedEvent(String.valueOf(d.getId()), String.valueOf(d.getUserAuthId()), d.getName()));
        } catch (Exception ignored) {}
    }
}
