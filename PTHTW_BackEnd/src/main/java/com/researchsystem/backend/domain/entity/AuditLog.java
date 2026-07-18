package com.researchsystem.backend.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_log_id")
    private Long auditLogId;

    /**
     * Stored as raw VARCHAR because DB triggers may write arbitrary strings.
     * Nullable — absent on the very first status transition.
     */
    @Column(name = "previous_status", nullable = true, length = 50)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 50)
    private String newStatus;

    @CreationTimestamp
    @Column(name = "action_timestamp", nullable = false, updatable = false)
    private LocalDateTime actionTimestamp;

    @Column(name = "feedback_message", nullable = true, columnDefinition = "TEXT")
    private String feedbackMessage;

    // -----------------------------------------------------------------------
    // Many-to-one foreign keys
    // -----------------------------------------------------------------------

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    @JsonIgnoreProperties({"auditLogs", "topicAttachments", "investigator", "managingDepartment", "assignedCouncil"})
    private Topic topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    @JsonIgnoreProperties({"topics", "councilMembers", "auditLogs", "passwordHash", "department"})
    private User actor;
}
