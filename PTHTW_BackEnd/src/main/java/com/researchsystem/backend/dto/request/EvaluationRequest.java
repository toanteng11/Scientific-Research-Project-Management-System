package com.researchsystem.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationRequest {

    @NotNull(message = "Council member ID must not be null")
    private Long councilMemberId;

    @NotNull(message = "Topic ID must not be null")
    private Long topicId;

    @NotNull(message = "Score for urgency must not be null")
    @DecimalMin(value = "0.00", message = "Score must be at least 0.00")
    @DecimalMax(value = "15.00", message = "Score must not exceed 15.00")
    private BigDecimal scoreUrgency;

    @NotNull(message = "Score for content must not be null")
    @DecimalMin(value = "0.00") @DecimalMax(value = "25.00")
    private BigDecimal scoreContent;

    @NotNull(message = "Score for objectives must not be null")
    @DecimalMin(value = "0.00") @DecimalMax(value = "20.00")
    private BigDecimal scoreObjectives;

    @NotNull(message = "Score for methodology must not be null")
    @DecimalMin(value = "0.00") @DecimalMax(value = "20.00")
    private BigDecimal scoreMethodology;

    @NotNull(message = "Score for feasibility must not be null")
    @DecimalMin(value = "0.00") @DecimalMax(value = "20.00")
    private BigDecimal scoreFeasibility;

    @NotNull(message = "Score for capacity must not be null")
    @DecimalMin(value = "0.00") @DecimalMax(value = "10.00")
    private BigDecimal scoreCapacity;

    @NotNull(message = "Score for products must not be null")
    @DecimalMin(value = "0.00") @DecimalMax(value = "10.00")
    private BigDecimal scoreProducts;

    private String generalComment;

    private String recommendedDecision;
}
