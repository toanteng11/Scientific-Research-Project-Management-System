package com.researchsystem.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouncilReadinessResponse {

    private Long councilId;
    private Long topicId;
    private boolean ready;
    private int totalNonSecretaries;
    private long submittedCount;
    private BigDecimal averageScore;
    private String message;
    private List<EvaluationStatusResponse> evaluations;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EvaluationStatusResponse {
        private Long councilMemberId;
        private String evaluatorFullName;
        private String councilRole;
        private BigDecimal totalScore;
        private String generalComment;
        private String recommendedDecision;
        private String submissionStatus;
    }
}
