package ro.utcn.ds.users.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private Long authId;   // ID-ul din auth-service

    @Column(nullable = false)
    private String role;   // "ADMIN" / "CLIENT"

    private String email;
    private String fullName;
}
