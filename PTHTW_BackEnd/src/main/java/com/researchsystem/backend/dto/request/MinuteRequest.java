package com.researchsystem.backend.dto.request;

import com.researchsystem.backend.domain.enums.FinalDecision;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MinuteRequest {

    @NotNull(message = "Topic ID must not be null")
    private Long topicId;

    private String synthesizedComments;

    /**
     * Optional on SECRETARY drafts (may be null or PENDING).
     * Required only when PRESIDENT uses the legacy endpoint to approve.
     */
    private FinalDecision finalDecision;

    /**
     * Optional on SECRETARY drafts; must be TRUE when PRESIDENT publishes
     * via the legacy endpoint.
     */
    private Boolean legalConfirmation;
}
