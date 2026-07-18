package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.entity.Council;
import com.researchsystem.backend.domain.entity.CouncilMember;
import com.researchsystem.backend.domain.entity.Evaluation;
import com.researchsystem.backend.domain.entity.Minute;
import com.researchsystem.backend.domain.entity.Topic;
import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.domain.enums.CouncilRole;
import com.researchsystem.backend.domain.enums.FinalDecision;
import com.researchsystem.backend.domain.enums.MinuteStatus;
import com.researchsystem.backend.domain.enums.SubmissionStatus;
import com.researchsystem.backend.domain.enums.SystemRole;
import com.researchsystem.backend.domain.enums.TopicStatus;
import com.researchsystem.backend.dto.request.MinuteApprovalRequest;
import com.researchsystem.backend.dto.request.MinuteRequest;
import com.researchsystem.backend.dto.response.MinuteResponse;
import com.researchsystem.backend.notification.TopicStatusChangedEvent;
import com.researchsystem.backend.repository.CouncilMemberRepository;
import com.researchsystem.backend.repository.EvaluationRepository;
import com.researchsystem.backend.repository.MinuteRepository;
import com.researchsystem.backend.repository.TopicRepository;
import com.researchsystem.backend.repository.UserRepository;
import com.researchsystem.backend.service.AuditLogService;
import com.researchsystem.backend.service.MinuteService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Lifecycle manager for the Council Meeting Minute document.
 *
 * Strictly separates:
 *   - Drafting (Secretary)           — {@link #draftMinute}
 *   - Approval + Publishing (President) — {@link #approveMinute}
 *   - Return to Secretary (President)   — {@link #returnMinute}
 *
 * Only {@link #approveMinute} may transition the Topic macro-FSM and
 * publish {@link TopicStatusChangedEvent}.
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class MinuteServiceImpl implements MinuteService {

    private final MinuteRepository minuteRepository;
    private final CouncilMemberRepository councilMemberRepository;
    private final EvaluationRepository evaluationRepository;
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final ApplicationEventPublisher eventPublisher;

    // ========================================================================
    // SECRETARY: draft the minute (no topic-FSM side effects)
    // ========================================================================
    @Override
    public MinuteResponse draftMinute(MinuteRequest request, String actorEmail) {
        Topic topic = loadTopicWithCouncil(request.getTopicId());
        Council council = topic.getAssignedCouncil();

        CouncilMember membership = requireCouncilMembership(council.getCouncilId(), actorEmail);
        if (membership.getCouncilRole() != CouncilRole.SECRETARY) {
            throw new AccessDeniedException("Chỉ Thư ký Hội đồng được phép lưu nháp biên bản.");
        }

        requireAllEvaluationsSubmitted(council.getCouncilId(), topic.getTopicId());

        Minute minute = minuteRepository.findByTopicTopicId(topic.getTopicId())
                .orElseGet(() -> Minute.builder()
                        .council(council)
                        .topic(topic)
                        .finalDecision(FinalDecision.PENDING)
                        .legalConfirmation(false)
                        .minuteStatus(MinuteStatus.DRAFT)
                        .build());

        if (minute.getMinuteStatus() == MinuteStatus.PUBLISHED) {
            throw new IllegalStateException("Biên bản đã được công bố, không thể chỉnh sửa.");
        }

        minute.setCouncil(council);
        minute.setTopic(topic);
        minute.setAverageScore(computeAverageScore(council.getCouncilId(), topic.getTopicId()));
        minute.setSynthesizedComments(sanitizeComments(request.getSynthesizedComments()));
        minute.setFinalDecision(FinalDecision.PENDING);
        minute.setLegalConfirmation(false);
        minute.setMinuteStatus(MinuteStatus.DRAFT);

        Minute saved = minuteRepository.save(minute);
        return toMinuteResponse(saved, council, topic);
    }

    // ========================================================================
    // PRESIDENT: approve & publish (ONLY authorised trigger for Topic FSM)
    // ========================================================================
    @Override
    public MinuteResponse approveMinute(Long minuteId, MinuteApprovalRequest request, String actorEmail) {
        Minute minute = minuteRepository.findById(minuteId)
                .orElseThrow(() -> new EntityNotFoundException("Biên bản không tồn tại: " + minuteId));

        Topic topic = minute.getTopic();
        Council council = minute.getCouncil();

        CouncilMember membership = requireCouncilMembership(council.getCouncilId(), actorEmail);
        if (membership.getCouncilRole() != CouncilRole.PRESIDENT) {
            throw new AccessDeniedException("Chỉ Chủ tịch Hội đồng được phép phê duyệt và công bố biên bản.");
        }

        if (minute.getMinuteStatus() == MinuteStatus.PUBLISHED) {
            throw new IllegalStateException("Biên bản đã được công bố trước đó.");
        }
        if (minute.getMinuteStatus() != MinuteStatus.DRAFT) {
            throw new IllegalStateException(
                    "Biên bản phải ở trạng thái DRAFT mới có thể phê duyệt. Hiện tại: "
                            + minute.getMinuteStatus());
        }

        if (request.getFinalDecision() == null || request.getFinalDecision() == FinalDecision.PENDING) {
            throw new IllegalStateException("Chủ tịch phải đưa ra kết luận chính thức khác PENDING.");
        }

        // Ensure evaluations are still intact at approval time (paranoia guard).
        requireAllEvaluationsSubmitted(council.getCouncilId(), topic.getTopicId());

        minute.setFinalDecision(request.getFinalDecision());
        minute.setLegalConfirmation(Boolean.TRUE.equals(request.getLegalConfirmation()));
        minute.setMinuteStatus(MinuteStatus.PUBLISHED);
        Minute saved = minuteRepository.save(minute);

        // -------- Macro FSM transition + async notifications fire HERE ONLY --
        TopicStatus previousStatus = topic.getTopicStatus();
        TopicStatus targetStatus = mapDecisionToTopicStatus(request.getFinalDecision());

        topic.setTopicStatus(targetStatus);
        topic.setSessionActive(false);
        topicRepository.save(topic);

        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng: " + actorEmail));

        auditLogService.recordLog(
                topic.getTopicId(),
                previousStatus,
                targetStatus,
                minute.getSynthesizedComments(),
                actorEmail);

        eventPublisher.publishEvent(new TopicStatusChangedEvent(
                this, topic, previousStatus, targetStatus, actor, minute.getSynthesizedComments()));

        return toMinuteResponse(saved, council, topic);
    }

    // ========================================================================
    // PRESIDENT: return draft to secretary (no topic-FSM side effects)
    // ========================================================================
    @Override
    public MinuteResponse returnMinute(Long minuteId, String reason, String actorEmail) {
        Minute minute = minuteRepository.findById(minuteId)
                .orElseThrow(() -> new EntityNotFoundException("Biên bản không tồn tại: " + minuteId));

        Council council = minute.getCouncil();
        Topic topic = minute.getTopic();

        CouncilMember membership = requireCouncilMembership(council.getCouncilId(), actorEmail);
        if (membership.getCouncilRole() != CouncilRole.PRESIDENT) {
            throw new AccessDeniedException("Chỉ Chủ tịch mới có quyền trả biên bản về cho Thư ký.");
        }

        if (minute.getMinuteStatus() != MinuteStatus.DRAFT) {
            throw new IllegalStateException(
                    "Chỉ có thể trả biên bản đang ở trạng thái DRAFT. Hiện tại: " + minute.getMinuteStatus());
        }

        minute.setMinuteStatus(MinuteStatus.RETURNED_TO_SECRETARY);
        // Keep verdict as PENDING while we wait for secretary to redraft.
        minute.setFinalDecision(FinalDecision.PENDING);
        minute.setLegalConfirmation(false);
        if (reason != null && !reason.isBlank()) {
            String prefix = "[Chủ tịch trả về biên bản] " + reason.trim() + "\n\n---\n";
            minute.setSynthesizedComments(prefix
                    + (minute.getSynthesizedComments() == null ? "" : minute.getSynthesizedComments()));
        }
        Minute saved = minuteRepository.save(minute);
        return toMinuteResponse(saved, council, topic);
    }

    // ========================================================================
    // LEGACY: backward-compatible shim for old POST /api/v1/minutes callers
    // ========================================================================
    @Override
    public MinuteResponse submitMinute(MinuteRequest request, String actorEmail) {
        Topic topic = loadTopicWithCouncil(request.getTopicId());
        CouncilMember membership = requireCouncilMembership(
                topic.getAssignedCouncil().getCouncilId(), actorEmail);

        if (membership.getCouncilRole() == CouncilRole.SECRETARY) {
            return draftMinute(request, actorEmail);
        }

        if (membership.getCouncilRole() == CouncilRole.PRESIDENT) {
            // If a draft doesn't exist yet, persist one first (legacy clients expected
            // the president to be able to save-and-publish in a single call).
            Minute existing = minuteRepository.findByTopicTopicId(topic.getTopicId()).orElse(null);
            if (existing == null || existing.getMinuteStatus() != MinuteStatus.DRAFT) {
                throw new IllegalStateException(
                        "Chưa có bản nháp biên bản của Thư ký để phê duyệt.");
            }
            MinuteApprovalRequest approval = MinuteApprovalRequest.builder()
                    .finalDecision(request.getFinalDecision())
                    .legalConfirmation(request.getLegalConfirmation())
                    .build();
            return approveMinute(existing.getMinuteId(), approval, actorEmail);
        }

        throw new AccessDeniedException(
                "Chỉ Thư ký hoặc Chủ tịch Hội đồng mới có quyền thao tác trên biên bản.");
    }

    @Override
    @Transactional(readOnly = true)
    public MinuteResponse getMinuteForTopic(Long topicId, String actorEmail) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new EntityNotFoundException("Topic not found with id: " + topicId));
        if (topic.getAssignedCouncil() == null) {
            throw new EntityNotFoundException(
                    "Topic has no assigned council; minutes are not available yet");
        }

        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + actorEmail));

        if (actor.getSystemRole() == SystemRole.MANAGER || actor.getSystemRole() == SystemRole.ADMIN) {
            // allowed
        } else if (actor.getSystemRole() == SystemRole.RESEARCHER) {
            if (topic.getInvestigator() == null
                    || !Objects.equals(topic.getInvestigator().getEmail(), actor.getEmail())) {
                throw new AccessDeniedException("Only the principal investigator may view minutes for this topic");
            }
        } else if (actor.getSystemRole() == SystemRole.COUNCIL) {
            boolean isMember = councilMemberRepository.findByCouncilCouncilIdAndUserEmail(
                    topic.getAssignedCouncil().getCouncilId(), actorEmail).isPresent();
            if (!isMember) {
                throw new AccessDeniedException(
                        "Only council members assigned to this topic can view its minutes");
            }
        } else {
            throw new AccessDeniedException("Not allowed to view meeting minutes for this topic");
        }

        Council council = topic.getAssignedCouncil();
        Minute minute = minuteRepository.findByTopicTopicId(topic.getTopicId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "No meeting minutes recorded for this topic yet"));

        return toMinuteResponse(minute, council, topic);
    }

    // ========================================================================
    // Internal helpers
    // ========================================================================

    private Topic loadTopicWithCouncil(Long topicId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new EntityNotFoundException("Topic not found with id: " + topicId));
        if (topic.getAssignedCouncil() == null) {
            throw new IllegalStateException("Topic has no assigned council");
        }
        return topic;
    }

    private CouncilMember requireCouncilMembership(Long councilId, String actorEmail) {
        return councilMemberRepository.findByCouncilCouncilIdAndUserEmail(councilId, actorEmail)
                .orElseThrow(() -> new AccessDeniedException("Bạn không phải thành viên của Hội đồng này."));
    }

    private void requireAllEvaluationsSubmitted(Long councilId, Long topicId) {
        List<CouncilMember> nonSecretaries = councilMemberRepository.findByCouncilCouncilId(councilId)
                .stream()
                .filter(m -> m.getCouncilRole() != CouncilRole.SECRETARY)
                .toList();

        if (nonSecretaries.isEmpty()) {
            throw new IllegalStateException("Hội đồng chưa có thành viên đánh giá hợp lệ.");
        }

        long submitted = evaluationRepository
                .countByTopicTopicIdAndCouncilMemberInAndSubmissionStatus(
                        topicId, nonSecretaries, SubmissionStatus.SUBMITTED);

        if (submitted != nonSecretaries.size()) {
            throw new IllegalStateException(String.format(
                    "Chưa đủ phiếu đánh giá để lập biên bản (%d/%d đã nộp).",
                    submitted, nonSecretaries.size()));
        }
    }

    private BigDecimal computeAverageScore(Long councilId, Long topicId) {
        List<CouncilMember> nonSecretaries = councilMemberRepository.findByCouncilCouncilId(councilId)
                .stream()
                .filter(m -> m.getCouncilRole() != CouncilRole.SECRETARY)
                .toList();

        List<Evaluation> submitted = evaluationRepository
                .findByTopicTopicIdAndCouncilMemberInAndSubmissionStatus(
                        topicId, nonSecretaries, SubmissionStatus.SUBMITTED);

        if (submitted.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return submitted.stream()
                .map(Evaluation::getTotalScore)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(submitted.size()), 2, RoundingMode.HALF_UP);
    }

    private String sanitizeComments(String raw) {
        return Optional.ofNullable(raw)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .orElse("(none)");
    }

    private TopicStatus mapDecisionToTopicStatus(FinalDecision decision) {
        return switch (decision) {
            case APPROVED -> TopicStatus.APPROVED;
            case REVISION_REQUIRED -> TopicStatus.REVISION_REQUIRED;
            case REJECTED -> TopicStatus.REJECTED;
            default -> throw new IllegalStateException("Unsupported final decision: " + decision);
        };
    }

    private MinuteResponse toMinuteResponse(Minute minute, Council council, Topic topic) {
        return MinuteResponse.builder()
                .minuteId(minute.getMinuteId())
                .topicId(topic.getTopicId())
                .councilId(council.getCouncilId())
                .councilName(council.getCouncilName())
                .averageScore(minute.getAverageScore())
                .synthesizedComments(minute.getSynthesizedComments())
                .finalDecision(minute.getFinalDecision())
                .minuteStatus(minute.getMinuteStatus())
                .legalConfirmation(minute.isLegalConfirmation())
                .createdAt(minute.getCreatedAt())
                .build();
    }
}
