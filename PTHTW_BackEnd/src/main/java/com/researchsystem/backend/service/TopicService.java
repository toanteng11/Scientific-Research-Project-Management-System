package com.researchsystem.backend.service;

import com.researchsystem.backend.dto.request.TopicCreationRequest;
import com.researchsystem.backend.dto.request.TopicStatusChangeRequest;
import com.researchsystem.backend.dto.request.UpdateTopicRequest;
import com.researchsystem.backend.dto.response.AttachmentResponse;
import com.researchsystem.backend.dto.response.AuditLogResponse;
import com.researchsystem.backend.dto.response.AttachmentDownloadPayload;
import com.researchsystem.backend.dto.response.TopicDetailResponse;
import com.researchsystem.backend.dto.response.TopicListResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface TopicService {

    /**
     * Creates a new research topic in DRAFT status on behalf of the investigator.
     */
    TopicDetailResponse createTopic(TopicCreationRequest request, String investigatorEmail);

    /**
     * Transitions a topic to a new status, enforcing the FSM ruleset and
     * recording an audit log entry before the status is applied.
     *
     * @throws IllegalStateException if the transition is not allowed from the current status
     */
    TopicDetailResponse changeTopicStatus(Long topicId,
                                          TopicStatusChangeRequest request,
                                          String actorEmail);

    /**
     * Returns all topics owned by the investigator with the given email (paginated).
     */
    Page<TopicListResponse> getTopicsByInvestigator(String email, Pageable pageable);

    /**
     * Returns all topics in the system (paginated). Intended for MANAGER and ADMIN.
     */
    Page<TopicListResponse> getAllTopics(Pageable pageable);

    /**
     * Returns the full detail view of a single topic after enforcing a zero-trust
     * ownership matrix on the authenticated actor.
     *
     * @throws jakarta.persistence.EntityNotFoundException if the topic or actor user does not exist
     * @throws org.springframework.security.access.AccessDeniedException if the actor may not read the topic
     */
    TopicDetailResponse getTopicById(Long id, String actorEmail);

    /**
     * Permanently deletes a topic. Only permitted when the topic is in DRAFT status.
     *
     * @throws IllegalStateException if the topic is not in DRAFT status
     */
    void deleteTopic(Long id, String actorEmail);

    /**
     * Updates mutable fields of a topic. Only permitted in DRAFT status.
     *
     * @throws IllegalStateException if the topic is not in DRAFT status
     */
    TopicDetailResponse updateTopic(Long id, UpdateTopicRequest request, String actorEmail);

    /**
     * Stores an uploaded file and records a new {@code TopicAttachment} for the topic.
     * Increments the topic's fileVersion counter.
     */
    AttachmentResponse uploadAttachment(Long topicId, MultipartFile file, String actorEmail);

    /**
     * Returns the full audit trail for a topic in chronological order.
     */
    List<AuditLogResponse> getAuditLogs(Long topicId, String actorEmail);

    /**
     * Calculates and returns the average {@code totalScore} across all SUBMITTED
     * evaluations for the council assigned to this topic.
     *
     * @throws IllegalStateException if no council is assigned or no evaluations have been submitted
     */
    BigDecimal getAverageScore(Long topicId);

    /**
     * Returns all topics belonging to a specific department (paginated).
     */
    Page<TopicListResponse> getTopicsByDepartment(Long departmentId, Pageable pageable);

    /**
     * Loads a stored attachment after verifying the topic/attachment link and actor authorization.
     */
    AttachmentDownloadPayload loadAttachmentForDownload(Long topicId, Long attachmentId, String actorEmail);
}
