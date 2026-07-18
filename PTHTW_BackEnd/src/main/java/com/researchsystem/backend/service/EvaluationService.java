package com.researchsystem.backend.service;

import com.researchsystem.backend.dto.request.EvaluationRequest;
import com.researchsystem.backend.dto.response.EvaluationResponse;

import java.util.Optional;

public interface EvaluationService {

    /**
     * Submits a scored evaluation form for a council member.
     * Calculates totalScore as the sum of the seven individual scores,
     * then sets the status to SUBMITTED.
     *
     * @param request   validated evaluation payload including councilMemberId and all scores
     * @param actorEmail email of the authenticated COUNCIL user (for audit logging)
     * @return the persisted evaluation record
     * @throws jakarta.persistence.EntityNotFoundException if the council member is not found
     * @throws IllegalStateException                       if the member has already submitted
     */
    EvaluationResponse submitEvaluation(EvaluationRequest request, String actorEmail);

    /**
     * Retrieves the existing evaluation for a given topic and council member, if any.
     * Used to restore immutable read-only state on page reload.
     */
    Optional<EvaluationResponse> getMyEvaluation(Long topicId, Long councilMemberId, String actorEmail);
}
