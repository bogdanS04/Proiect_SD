package ro.utcn.ds.device.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "synced_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncedUser {

    @Id
    @Column(name = "id")
    private Long id; // user-service ID

    @Column(name = "auth_id", nullable = false)
    private Long authId;

    @Column(name = "email")
    private String email;

    @Column(name = "created_at")
    private Instant createdAt;
}
