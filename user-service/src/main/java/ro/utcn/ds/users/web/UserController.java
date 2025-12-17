package ro.utcn.ds.users.web;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import ro.utcn.ds.users.dto.UserProfileCreate;
import ro.utcn.ds.users.model.AppUser;
import ro.utcn.ds.users.repo.UserRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import ro.utcn.ds.users.amqp.AmqpConfig;
import ro.utcn.ds.users.amqp.UserCreatedEvent;
import ro.utcn.ds.users.amqp.UserDeletedEvent;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository repo;
    private final RabbitTemplate rabbit;

    @Value("${internal.secret}")
    private String internalSecret;

    private boolean isAdmin(HttpServletRequest req) {
        String role = req.getHeader("X-User-Role");
        return "ADMIN".equalsIgnoreCase(role);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody UserProfileCreate body, HttpServletRequest request) {
        String hdr = request.getHeader("X-Internal-Auth");
        if (hdr == null || !hdr.equals(internalSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("unauthorized");
        }
        if (body.authId() == null || body.username() == null || body.role() == null) {
            return ResponseEntity.badRequest().body("authId, username și role sunt obligatorii");
        }
        if (repo.existsByUsername(body.username())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("username deja există");
        }
        AppUser u = AppUser.builder()
                .authId(body.authId())
                .username(body.username())
                .email(body.email())
                .fullName(body.fullName())
                .role(body.role())
                .build();
        u = repo.save(u);
        // publish user.created for sync (best-effort, nu stricăm flow-ul dacă brokerul e down)
        try {
            rabbit.convertAndSend(AmqpConfig.SYNC_EXCHANGE, "user.created",
                    new UserCreatedEvent(u.getId(), u.getAuthId(), u.getEmail(), java.time.Instant.now()));
            log.debug("Published user.created id={} authId={}", u.getId(), u.getAuthId());
        } catch (Exception ignored) {}
        return ResponseEntity.created(URI.create("/api/users/" + u.getId())).body(u);
    }

    @GetMapping
    public ResponseEntity<?> all(HttpServletRequest req) {
        if (!isAdmin(req)) return ResponseEntity.status(403).body("forbidden");
        List<AppUser> list = repo.findAll();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> byId(@PathVariable Long id, HttpServletRequest req){
        if (!isAdmin(req)) return ResponseEntity.status(403).body("forbidden");
        return repo.findById(id).<ResponseEntity<?>>map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody AppUser body, HttpServletRequest req){
        if (!isAdmin(req)) return ResponseEntity.status(403).body("forbidden");
        return repo.findById(id).map(u -> {
            if (body.getEmail()!=null) u.setEmail(body.getEmail());
            if (body.getFullName()!=null) u.setFullName(body.getFullName());
            if (body.getRole()!=null) u.setRole(body.getRole());
            return ResponseEntity.ok(repo.save(u));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, HttpServletRequest req){
        if (!isAdmin(req)) return ResponseEntity.status(403).body("forbidden");
        return repo.findById(id).map(u -> {
            repo.delete(u);
            try {
                rabbit.convertAndSend(AmqpConfig.SYNC_EXCHANGE, "user.deleted",
                        new UserDeletedEvent(u.getId(), u.getAuthId()));
                log.debug("Published user.deleted id={} authId={}", u.getId(), u.getAuthId());
            } catch (Exception ignored) {}
            return ResponseEntity.noContent().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
