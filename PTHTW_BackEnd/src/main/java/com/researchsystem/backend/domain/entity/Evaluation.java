package com.researchsystem.backend.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.researchsystem.backend.domain.enums.SubmissionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "evaluations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "evaluation_id")
    private Long evaluationId;

    @Column(name = "score_urgency", nullable = false, precision = 5, scale = 2)
    private BigDecimal scoreUrgency;

    @Column(name = "score_content", nullable = false, precision = 5, scale = 2)
    private BigDecimal scoreContent;

    @Column(name = "score_objectives", nullable = false, precision = 5, scale = 2)
    private BigDecimal scoreObjectives;

    @Column(name = "score_methodology", nullable = false, precision = 5, scale = 2)
    private BigDecimal scoreMethodology;

    @Column(name = "score_feasibility", nullable = false, precision = 5, scale = 2)
    private BigDecimal scoreFeasibility;

    @Column(name = "score_capacity", nullable = false, precision = 5, scale = 2)
    private BigDecimal scoreCapacity;

    @Column(name = "score_products", nullable = false, precision = 5, scale = 2)
    private BigDecimal scoreProducts;

    @Column(name = "total_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "general_comment", nullable = true, columnDefinition = "TEXT")
    private String generalComment;

    /**
     * Reviewer's recommended verdict — stored as raw VARCHAR(50) to remain
     * flexible if future decisions beyond FinalDecision are needed.
     */
    @Column(name = "recommended_decision", nullable = true, length = 50)
    private String recommendedDecision;

    @Enumerated(EnumType.STRING)
    @Column(name = "submission_status", nullable = false, length = 50)
    private SubmissionStatus submissionStatus;

    // -----------------------------------------------------------------------
    // Many-to-one: each evaluation is submitted by one council member
    // -----------------------------------------------------------------------

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "council_member_id", nullable = false)
    @JsonIgnoreProperties({"evaluations", "council", "user"})
    private CouncilMember councilMember;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    @JsonIgnoreProperties({"topicAttachments", "auditLogs", "assignedCouncil", "investigator", "managingDepartment"})
    private Topic topic;
}
