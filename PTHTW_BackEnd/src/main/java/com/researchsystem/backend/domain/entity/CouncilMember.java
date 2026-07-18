package com.researchsystem.backend.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.researchsystem.backend.domain.enums.CouncilRole;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "council_members",
        uniqueConstraints = @UniqueConstraint(
                name = "idx_unique_council_user",
                columnNames = {"council_id", "user_id"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouncilMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "council_member_id")
    private Long councilMemberId;

    @Enumerated(EnumType.STRING)
    @Column(name = "council_role", nullable = false, length = 50)
    private CouncilRole councilRole;

    // -----------------------------------------------------------------------
    // Many-to-one foreign keys (the two sides of the bridge)
    // -----------------------------------------------------------------------

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "council_id", nullable = false)
    @JsonIgnoreProperties({"councilMembers", "topics", "minute"})
    private Council council;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"topics", "councilMembers", "auditLogs", "passwordHash", "department"})
    private User user;

    // -----------------------------------------------------------------------
    // Bidirectional: one council member may submit one evaluation
    // -----------------------------------------------------------------------

    @Builder.Default
    @OneToMany(
            mappedBy = "councilMember",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties({"councilMember"})
    private List<Evaluation> evaluations = new ArrayList<>();
}
