package com.researchsystem.backend.service;

import com.researchsystem.backend.domain.enums.TopicStatus;

public interface AuditLogService {

    /**
     * Persists a status-change record for auditing purposes.
     *
     * @param topicId        ID of the affected topic
     * @param previousStatus status before the transition (may be null on first log)
     * @param newStatus      status after the transition
     * @param feedback       optional reviewer note
     * @param actorEmail     email of the authenticated user performing the action
     */
    void recordLog(Long topicId,
                   TopicStatus previousStatus,
                   TopicStatus newStatus,
                   String feedback,
                   String actorEmail);
}
