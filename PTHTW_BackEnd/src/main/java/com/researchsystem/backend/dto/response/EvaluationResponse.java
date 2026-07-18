package com.researchsystem.backend.dto.response;

import com.researchsystem.backend.domain.enums.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationResponse {

    private Long evaluationId;
    private Long councilMemberId;
    private Long topicId;
    private String evaluatorFullName;
    private BigDecimal scoreUrgency;
    private BigDecimal scoreContent;
    private BigDecimal scoreObjectives;
    private BigDecimal scoreMethodology;
    private BigDecimal scoreFeasibility;
    private BigDecimal scoreCapacity;
    private BigDecimal scoreProducts;
    private BigDecimal totalScore;
    private String generalComment;
    private String recommendedDecision;
    private SubmissionStatus submissionStatus;
}
