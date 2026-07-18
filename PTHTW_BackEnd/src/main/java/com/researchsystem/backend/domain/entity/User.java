package com.researchsystem.backend.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.researchsystem.backend.domain.enums.SystemRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @JsonIgnore
    @Column(name = "password_hash", nullable = false, length = 60)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "academic_title", nullable = true, length = 50)
    private String academicTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "system_role", nullable = false, length = 50)
    private SystemRole systemRole;

    @Column(name = "is_first_login", nullable = false)
    private boolean isFirstLogin;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "failed_login_attempts", nullable = false)
    @Builder.Default
    private int failedLoginAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    // -----------------------------------------------------------------------
    // Many-to-one: a user optionally belongs to a department
    // -----------------------------------------------------------------------

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = true)
    @JsonIgnoreProperties({"users", "topics"})
    private Department department;

    // -----------------------------------------------------------------------
    // Bidirectional relationships
    // -----------------------------------------------------------------------

    @Builder.Default
    @OneToMany(
            mappedBy = "investigator",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties({"investigator"})
    private List<Topic> topics = new ArrayList<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "user",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties({"user"})
    private List<CouncilMember> councilMembers = new ArrayList<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "actor",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties({"actor"})
    private List<AuditLog> auditLogs = new ArrayList<>();
}