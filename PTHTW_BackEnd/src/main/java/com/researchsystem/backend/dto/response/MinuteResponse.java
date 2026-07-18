package com.researchsystem.backend.dto.response;

import com.researchsystem.backend.domain.enums.FinalDecision;
import com.researchsystem.backend.domain.enums.MinuteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MinuteResponse {

    private Long minuteId;
    private Long topicId;
    private Long councilId;
    private String councilName;
    private BigDecimal averageScore;
    private String synthesizedComments;

    /** Legal verdict set by the President when publishing. */
    private FinalDecision finalDecision;

    /** Micro-FSM document state (DRAFT / RETURNED_TO_SECRETARY / PUBLISHED). */
    private MinuteStatus minuteStatus;

    private Boolean legalConfirmation;
    private LocalDateTime createdAt;
}
