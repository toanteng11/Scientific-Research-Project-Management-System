package com.researchsystem.backend.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "councils")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Council {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "council_id")
    private Long councilId;

    @Column(name = "council_name", nullable = false, length = 255)
    private String councilName;

    @Column(name = "meeting_date", nullable = false)
    private LocalDate meetingDate;

    @Column(name = "meeting_time", nullable = false)
    private LocalTime meetingTime;

    @Column(name = "meeting_location", nullable = false, length = 255)
    private String meetingLocation;

    // -----------------------------------------------------------------------
    // Bidirectional relationships
    // -----------------------------------------------------------------------
    // FIX: Changed List<> to Set<> to resolve MultipleBagFetchException.
    // Hibernate cannot simultaneously fetch multiple List (bag) collections
    // via @EntityGraph. Using Set<> makes them bag-safe.

    @Builder.Default
    @OneToMany(
            mappedBy = "council",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties({"council"})
    private Set<CouncilMember> councilMembers = new LinkedHashSet<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "assignedCouncil",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties({"assignedCouncil"})
    private Set<Topic> topics = new LinkedHashSet<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "council",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties({"council", "topic"})
    private Set<Minute> minutes = new LinkedHashSet<>();
}
