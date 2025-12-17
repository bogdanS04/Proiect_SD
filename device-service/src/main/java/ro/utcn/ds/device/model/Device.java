package ro.utcn.ds.device.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name="devices", indexes = {
        @Index(name="idx_devices_userAuthId", columnList = "userAuthId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Device {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private Long userAuthId;       // id din auth-service (JWT sub)

    @Column(nullable=false, length=120)
    private String name;

    @Column(length=255)
    private String description;

    @Column(nullable=false, length=30)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE/INACTIVE

    @Column(nullable=false, updatable=false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(nullable=false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate(){ updatedAt = Instant.now(); }
}
