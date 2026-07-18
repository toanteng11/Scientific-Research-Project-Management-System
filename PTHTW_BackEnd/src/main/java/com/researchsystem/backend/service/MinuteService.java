package com.researchsystem.backend.service;

import com.researchsystem.backend.dto.request.MinuteApprovalRequest;
import com.researchsystem.backend.dto.request.MinuteRequest;
import com.researchsystem.backend.dto.response.MinuteResponse;

/**
 * Service façade for the Council Meeting Minute document lifecycle.
 *
 * The document follows a micro-FSM orthogonal to the Topic macro-FSM:
 *
 *   Secretary drafts         →  MinuteStatus.DRAFT
 *   President returns draft  →  MinuteStatus.RETURNED_TO_SECRETARY
 *   President approves       →  MinuteStatus.PUBLISHED  (+ Topic FSM fires)
 *
 * Only {@link #approveMinute(Long, MinuteApprovalRequest, String)} is permitted
 * to transition the Topic's macro-state and trigger notification events.
 */
public interface MinuteService {

    /**
     * SECRETARY-only: persist or overwrite the working draft for a topic.
     * Does NOT transition the Topic FSM and does NOT publish notifications.
     *
     * @throws org.springframework.security.access.AccessDeniedException
     *         if actor is not the assigned SECRETARY of this topic's council
     * @throws IllegalStateException
     *         if not all non-secretary members have submitted evaluations yet
     */
    MinuteResponse draftMinute(MinuteRequest request, String actorEmail);

    /**
     * PRESIDENT-only: approve & publish a draft minute.
     * This is the sole authorised action that transitions the Topic FSM
     * and fires {@link com.researchsystem.backend.notification.TopicStatusChangedEvent}.
     *
     * @param minuteId identifier of the DRAFT minute to publish
     * @param request  President's final verdict + legal confirmation
     * @param actorEmail email of the authenticated PRESIDENT
     *
     * @throws org.springframework.security.access.AccessDeniedException
     *         if actor is not the PRESIDENT of this minute's council
     * @throws IllegalStateException
     *         if the minute is not currently in DRAFT state
     */
    MinuteResponse approveMinute(Long minuteId, MinuteApprovalRequest request, String actorEmail);

    /**
     * PRESIDENT-only: return a draft to the SECRETARY for revision.
     * Transitions the minute to {@link com.researchsystem.backend.domain.enums.MinuteStatus#RETURNED_TO_SECRETARY}.
     * Does NOT touch the Topic FSM or publish lifecycle notifications.
     *
     * @param reason optional short message explaining why the draft was returned
     */
    MinuteResponse returnMinute(Long minuteId, String reason, String actorEmail);

    /**
     * LEGACY endpoint used by older clients: delegates to {@link #draftMinute}
     * for a SECRETARY, or performs a draft-then-approve for a PRESIDENT.
     *
     * New integrations should call {@link #draftMinute} and
     * {@link #approveMinute} directly.
     */
    MinuteResponse submitMinute(MinuteRequest request, String actorEmail);

    /**
     * Returns meeting minutes for the council linked to the topic, if the actor may view them.
     */
    MinuteResponse getMinuteForTopic(Long topicId, String actorEmail);
}
