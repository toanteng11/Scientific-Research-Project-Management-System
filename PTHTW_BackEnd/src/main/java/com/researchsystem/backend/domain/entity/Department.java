package com.researchsystem.backend.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "departments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "department_code", nullable = false, unique = true, length = 50)
    private String departmentCode;

    @Column(name = "department_name", nullable = false, length = 255)
    private String departmentName;

    @Column(name = "contact_email", nullable = true, length = 255)
    private String contactEmail;

    @Column(name = "contact_phone", nullable = true, length = 20)
    private String contactPhone;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    // -----------------------------------------------------------------------
    // Bidirectional relationships
    // -----------------------------------------------------------------------

    @Builder.Default
    @OneToMany(
            mappedBy = "department",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties({"department"})
    private List<User> users = new ArrayList<>();

    @Builder.Default
    @OneToMany(
            mappedBy = "managingDepartment",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @JsonIgnoreProperties({"managingDepartment"})
    private List<Topic> topics = new ArrayList<>();
}
