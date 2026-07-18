package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.entity.Council;
import com.researchsystem.backend.domain.entity.CouncilMember;
import com.researchsystem.backend.domain.entity.Notification;
import com.researchsystem.backend.domain.entity.Topic;
import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.domain.enums.CouncilRole;
import com.researchsystem.backend.domain.enums.SubmissionStatus;
import com.researchsystem.backend.domain.enums.SystemRole;
import com.researchsystem.backend.domain.enums.TopicStatus;
import com.researchsystem.backend.dto.request.AssignTopicsRequest;
import com.researchsystem.backend.dto.request.CouncilAssignmentRequest;
import com.researchsystem.backend.dto.request.CouncilCreateRequest;
import com.researchsystem.backend.dto.request.CouncilCreationWithAssignmentRequest;
import com.researchsystem.backend.dto.response.CouncilDetailResponse;
import com.researchsystem.backend.dto.response.CouncilListResponse;
import com.researchsystem.backend.dto.response.CouncilReadinessResponse;
import com.researchsystem.backend.dto.response.TopicListResponse;
import com.researchsystem.backend.mapper.TopicMapper;
import com.researchsystem.backend.notification.TopicStatusChangedEvent;
import com.researchsystem.backend.repository.CouncilMemberRepository;
import com.researchsystem.backend.repository.CouncilRepository;
import com.researchsystem.backend.repository.EvaluationRepository;
import com.researchsystem.backend.repository.NotificationRepository;
import com.researchsystem.backend.repository.TopicRepository;
import com.researchsystem.backend.repository.UserRepository;
import com.researchsystem.backend.service.AuditLogService;
import com.researchsystem.backend.service.CouncilService;
import com.researchsystem.backend.service.EmailService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import com.researchsystem.backend.domain.entity.Evaluation;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CouncilServiceImpl implements CouncilService {

    private final CouncilRepository councilRepository;
    private final UserRepository userRepository;
    private final CouncilMemberRepository councilMemberRepository;
    private final EvaluationRepository evaluationRepository;
    private final TopicRepository topicRepository;
    private final TopicMapper topicMapper;
    private final NotificationRepository notificationRepository;
    private final AuditLogService auditLogService;
    private final ApplicationEventPublisher eventPublisher;
    private final EmailService emailService;

    // ============================================================================
    // VÁ LỖ HỔNG NGHIỆP VỤ: THƯ KÝ BẮT ĐẦU PHIÊN HỌP MỞ QUYỀN CHẤM ĐIỂM
    // ============================================================================
    @Override
    @Transactional
    public void startTopicSession(Long topicId, String actorEmail) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new EntityNotFoundException("Đề tài không tồn tại"));

        if (topic.getAssignedCouncil() == null) {
            throw new IllegalStateException("Đề tài chưa được gán cho hội đồng nào.");
        }

        // Xác thực quyền: Chỉ Chủ tịch của hội đồng được gán mới có quyền bắt đầu phiên
        CouncilMember membership = councilMemberRepository
                .findByCouncilCouncilIdAndUserEmail(topic.getAssignedCouncil().getCouncilId(), actorEmail)
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Bạn không thuộc hội đồng này."));

        if (membership.getCouncilRole() != CouncilRole.PRESIDENT) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ Chủ tịch mới có quyền bắt đầu phiên họp.");
        }

        if (topic.isSessionActive()) {
            throw new IllegalStateException("Phiên họp cho đề tài này đã được bắt đầu trước đó.");
        }

        Council council = topic.getAssignedCouncil();
        if (council.getMeetingDate() != null) {
            LocalDateTime scheduledAt = LocalDateTime.of(
                    council.getMeetingDate(),
                    council.getMeetingTime() != null ? council.getMeetingTime() : java.time.LocalTime.MIN
            );
            if (LocalDateTime.now().isBefore(scheduledAt)) {
                throw new IllegalStateException("Chưa đến thời điểm họp theo lịch được phê duyệt.");
            }
        }

        List<CouncilMember> allMembers = councilMemberRepository.findByCouncilCouncilId(council.getCouncilId());
        boolean hasSecretary = allMembers.stream().anyMatch(m -> m.getCouncilRole() == CouncilRole.SECRETARY);
        boolean hasPresident = allMembers.stream().anyMatch(m -> m.getCouncilRole() == CouncilRole.PRESIDENT);
        long evaluatorCount = allMembers.stream().filter(m -> m.getCouncilRole() != CouncilRole.SECRETARY).count();
        if (!hasSecretary || !hasPresident || evaluatorCount == 0) {
            throw new IllegalStateException("Hội đồng chưa đủ điều kiện quorum để bắt đầu phiên họp.");
        }

        topic.setSessionActive(true);
        topicRepository.save(topic);

        // Optional: Publish event hoặc gửi Notification cho các chuyên gia báo form đã mở
    }

    @Override
    @Transactional
    public CouncilDetailResponse createAndAssign(CouncilCreationWithAssignmentRequest request, String actorEmail) {
        CouncilCreateRequest councilInfo = request.getCouncilInfo();
        validateMeetingSchedule(councilInfo.getMeetingDate(), councilInfo.getMeetingTime());

        Council newCouncil = Council.builder()
                .councilName(councilInfo.getCouncilName())
                .meetingDate(councilInfo.getMeetingDate())
                .meetingTime(councilInfo.getMeetingTime())
                .meetingLocation(councilInfo.getMeetingLocation())
                .build();
        Council savedCouncil = councilRepository.save(newCouncil);

        CouncilAssignmentRequest memberRequest = new CouncilAssignmentRequest();
        memberRequest.setMembers(request.getMembers());
        assignCouncilMembers(savedCouncil.getCouncilId(), memberRequest);

        AssignTopicsRequest topicRequest = new AssignTopicsRequest();
        topicRequest.setTopicIds(List.of(request.getTopicId()));
        assignTopics(savedCouncil.getCouncilId(), topicRequest, actorEmail);

        return getCouncilById(savedCouncil.getCouncilId());
    }

    @Override
    public void assignCouncilMembers(Long councilId, CouncilAssignmentRequest request) {

        if (!councilRepository.existsById(councilId)) {
            throw new EntityNotFoundException("Council not found with id: " + councilId);
        }
        Council councilRef = councilRepository.getReferenceById(councilId);

        List<CouncilAssignmentRequest.ExpertAssignment> assignments = request.getMembers();
        Set<Long> uniqueIds = new HashSet<>();
        for (CouncilAssignmentRequest.ExpertAssignment ea : assignments) {
            if (!uniqueIds.add(ea.getUserId())) {
                throw new IllegalArgumentException("Duplicate user IDs in the request");
            }
        }

        List<CouncilMember> existing = councilMemberRepository.findByCouncilCouncilId(councilId);
        Set<Long> existingUserIds = new HashSet<>();
        for (CouncilMember cm : existing) {
            existingUserIds.add(cm.getUser().getUserId());
        }

        long presidentsInRequest = assignments.stream()
                .filter(a -> a.getCouncilRole() == CouncilRole.PRESIDENT)
                .count();
        long secretariesInRequest = assignments.stream()
                .filter(a -> a.getCouncilRole() == CouncilRole.SECRETARY)
                .count();
        if (presidentsInRequest > 1 || secretariesInRequest > 1) {
            throw new IllegalArgumentException("At most one PRESIDENT and one SECRETARY may be assigned per request batch");
        }

        long existingPresidents = existing.stream().filter(m -> m.getCouncilRole() == CouncilRole.PRESIDENT).count();
        long existingSecretaries = existing.stream().filter(m -> m.getCouncilRole() == CouncilRole.SECRETARY).count();
        if (existingPresidents + presidentsInRequest > 1) {
            throw new IllegalArgumentException("Council already has a PRESIDENT");
        }
        if (existingSecretaries + secretariesInRequest > 1) {
            throw new IllegalArgumentException("Council already has a SECRETARY");
        }

        for (CouncilAssignmentRequest.ExpertAssignment ea : assignments) {
            if (existingUserIds.contains(ea.getUserId())) {
                throw new IllegalArgumentException("User " + ea.getUserId() + " is already assigned to this council");
            }
        }

        for (Topic topic : topicRepository.findByAssignedCouncilCouncilId(councilId, Pageable.unpaged()).getContent()) {
            Long investigatorId = topic.getInvestigator().getUserId();
            for (CouncilAssignmentRequest.ExpertAssignment ea : assignments) {
                if (Objects.equals(ea.getUserId(), investigatorId)) {
                    throw new IllegalArgumentException("Investigator cannot be in their own council");
                }
            }
        }

        List<CouncilMember> newMembers = new ArrayList<>();
        for (CouncilAssignmentRequest.ExpertAssignment ea : assignments) {
            User expert = userRepository.findById(ea.getUserId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "User not found with id: " + ea.getUserId()));
            if (expert.getSystemRole() != SystemRole.COUNCIL) {
                throw new IllegalArgumentException("User " + ea.getUserId() + " must have system role COUNCIL");
            }

            newMembers.add(CouncilMember.builder()
                    .council(councilRef)
                    .user(expert)
                    .councilRole(ea.getCouncilRole())
                    .build());
        }

        councilMemberRepository.saveAll(newMembers);

        for (CouncilMember cm : newMembers) {
            User expert = cm.getUser();
            String roleLabel = cm.getCouncilRole().name();
            
            Notification notification = Notification.builder()
                    .recipient(expert)
                    .notificationType("COUNCIL_ASSIGNMENT")
                    .title("Thư mời tham gia Hội đồng Xét duyệt")
                    .body("Phòng Quản lý Khoa học trân trọng kính mời chuyên gia tham gia Hội đồng: " 
                            + councilRef.getCouncilName() + " với vai trò " + roleLabel + ". " +
                            "Phiên họp dự kiến diễn ra vào " + councilRef.getMeetingDate() + " tại " + councilRef.getMeetingLocation() + ".")
                    .resourceType("COUNCIL")
                    .resourceId(councilId)
                    .build();
            notificationRepository.save(notification);

            emailService.sendPlainText(
                    expert.getEmail(),
                    "Thư mời tham gia Hội đồng Xét duyệt",
                    String.format(
                            """
                            Kính gửi %s,

                            Phòng Quản lý Khoa học trân trọng kính mời Ngài tham gia Hội đồng: %s
                            với vai trò: %s.

                            Phiên họp dự kiến diễn ra vào ngày %s tại %s.

                            Đường dẫn đăng nhập: https://qldt.ou.edu.vn/login
                            Lưu ý: Nếu đây là lần đăng nhập đầu tiên, Ngài cần đổi mật khẩu mặc định.

                            Trân trọng,
                            Hệ thống Quản lý Đề tài NCKH — Trường Đại học Mở TP.HCM
                            """,
                            expert.getFullName(),
                            councilRef.getCouncilName(),
                            roleLabel,
                            councilRef.getMeetingDate(),
                            councilRef.getMeetingLocation()
                    ));
        }
    }

    @Override
    public void assignTopics(Long councilId, AssignTopicsRequest request, String actorEmail) {
        Council council = councilRepository.findById(councilId)
                .orElseThrow(() -> new EntityNotFoundException("Council not found with id: " + councilId));

        if (isCouncilExpired(council, LocalDateTime.now())) {
            throw new IllegalStateException("Cannot assign topics to an expired council session.");
        }

        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new EntityNotFoundException("Actor not found: " + actorEmail));

        for (Long topicId : request.getTopicIds()) {
            Topic topic = topicRepository.findById(topicId)
                    .orElseThrow(() -> new EntityNotFoundException("Topic not found with id: " + topicId));

            if (topic.getTopicStatus() != TopicStatus.DEPT_APPROVED) {
                throw new IllegalStateException(
                        "Topic " + topicId + " must be in DEPT_APPROVED status to be assigned to a council. " +
                        "Current status: " + topic.getTopicStatus());
            }

            for (CouncilMember cm : council.getCouncilMembers()) {
                if (cm.getUser().getUserId().equals(topic.getInvestigator().getUserId())) {
                    throw new org.springframework.security.access.AccessDeniedException("Conflict of Interest: Investigator is a member of the assigned council.");
                }
            }

            topic.setAssignedCouncil(council);
            topic.setTopicStatus(TopicStatus.PENDING_COUNCIL);
            topicRepository.save(topic);

            auditLogService.recordLog(
                    topicId,
                    TopicStatus.DEPT_APPROVED,
                    TopicStatus.PENDING_COUNCIL,
                    "Đề tài được giao cho Hội đồng xét duyệt: " + council.getCouncilName(),
                    actorEmail
            );

            for (CouncilMember cm : council.getCouncilMembers()) {
                User expert = cm.getUser();
                
                Notification n = Notification.builder()
                        .recipient(expert)
                        .notificationType("NEW_TOPIC_EVALUATION")
                        .title("Được phân công đánh giá đề tài mới")
                        .body("Đề tài: " + topic.getTitleVn() + " đã được gán cho Hội đồng của ngài.")
                        .resourceType("TOPIC")
                        .resourceId(topicId)
                        .build();
                notificationRepository.save(n);

                emailService.sendPlainText(
                        expert.getEmail(),
                        String.format("Mời đánh giá đề tài NCKH mã số %s", topic.getTopicCode()),
                        String.format(
                                """
                                Kính gửi %s,

                                Hệ thống Quản lý Đề tài NCKH xin thông báo Ngài đã được phân công \
                                đánh giá đề tài: %s
                                Đơn vị quản lý: %s

                                --- THÔNG TIN ĐĂNG NHẬP ---
                                Tài khoản: %s
                                Mật khẩu: Sử dụng mật khẩu đã được cấp (hoặc mật khẩu tạm thời nếu là tài khoản mới).
                                Đường dẫn đánh giá: https://qldt.ou.edu.vn/expert/evaluations/%d

                                Trân trọng,
                                Hệ thống Quản lý Đề tài NCKH — Trường Đại học Mở TP.HCM
                                """,
                                expert.getFullName(),
                                topic.getTitleVn(),
                                topic.getManagingDepartment().getDepartmentName(),
                                expert.getEmail(),
                                topicId
                        ));
            }

            User investigator = topic.getInvestigator();
            Notification investigatorNotif = Notification.builder()
                    .recipient(investigator)
                    .notificationType("TOPIC_ASSIGNED_COUNCIL")
                    .title("Đề tài đã được chuyển sang Hội đồng xét duyệt")
                    .body("Đề tài \"" + topic.getTitleVn() + "\" (mã: " + topic.getTopicCode()
                            + ") đã được Phòng QLKH giao cho Hội đồng: " + council.getCouncilName()
                            + ". Phiên họp dự kiến: " + council.getMeetingDate()
                            + " tại " + council.getMeetingLocation() + ".")
                    .resourceType("TOPIC")
                    .resourceId(topicId)
                    .build();
            notificationRepository.save(investigatorNotif);

            emailService.sendPlainText(
                    investigator.getEmail(),
                    String.format("Đề tài %s đã được chuyển sang Hội đồng xét duyệt", topic.getTopicCode()),
                    String.format(
                            """
                            Kính gửi %s,

                            Đề tài "%s" (mã: %s) của Ngài đã được Phòng QLKH giao cho \
                            Hội đồng: %s.
                            Phiên họp dự kiến: %s tại %s.

                            Trân trọng,
                            Hệ thống Quản lý Đề tài NCKH — Trường Đại học Mở TP.HCM
                            """,
                            investigator.getFullName(),
                            topic.getTitleVn(),
                            topic.getTopicCode(),
                            council.getCouncilName(),
                            council.getMeetingDate(),
                            council.getMeetingLocation()
                    ));

            List<User> deptHeads = userRepository.findByDepartmentDepartmentIdAndSystemRole(
                    topic.getManagingDepartment().getDepartmentId(), SystemRole.DEPT_HEAD);

            for (User head : deptHeads) {
                Notification headNotif = Notification.builder()
                        .recipient(head)
                        .notificationType("TOPIC_ASSIGNED_COUNCIL")
                        .title("Đề tài của Khoa đã được giao Hội đồng")
                        .body("Đề tài \"" + topic.getTitleVn() + "\" (mã: " + topic.getTopicCode()
                                + ") thuộc Khoa " + topic.getManagingDepartment().getDepartmentName()
                                + " đã được Phòng QLKH giao cho Hội đồng: " + council.getCouncilName() + ".")
                        .resourceType("TOPIC")
                        .resourceId(topicId)
                        .build();
                notificationRepository.save(headNotif);

                emailService.sendPlainText(
                        head.getEmail(),
                        String.format("Đề tài %s của Khoa đã được giao Hội đồng", topic.getTopicCode()),
                        String.format(
                                """
                                Kính gửi %s,

                                Đề tài "%s" (mã: %s) thuộc Khoa %s đã được Phòng QLKH \
                                giao cho Hội đồng: %s.

                                Trân trọng,
                                Hệ thống Quản lý Đề tài NCKH — Trường Đại học Mở TP.HCM
                                """,
                                head.getFullName(),
                                topic.getTitleVn(),
                                topic.getTopicCode(),
                                topic.getManagingDepartment().getDepartmentName(),
                                council.getCouncilName()
                        ));
            }

            eventPublisher.publishEvent(
                    new TopicStatusChangedEvent(this, topic, TopicStatus.DEPT_APPROVED, TopicStatus.PENDING_COUNCIL, actor, null)
            );
        }
    }

    @Override
    public void removeCouncilMember(Long councilId, Long userId) {
        councilRepository.findById(councilId)
                .orElseThrow(() -> new EntityNotFoundException("Council not found with id: " + councilId));
        CouncilMember member = councilMemberRepository
                .findByCouncilCouncilIdAndUserUserId(councilId, userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No council membership for user " + userId + " on council " + councilId));
        councilMemberRepository.delete(member);
    }

    @Override
    public void removeTopicFromCouncil(Long councilId, Long topicId) {
        councilRepository.findById(councilId)
                .orElseThrow(() -> new EntityNotFoundException("Council not found with id: " + councilId));
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new EntityNotFoundException("Topic not found with id: " + topicId));
        if (topic.getAssignedCouncil() == null
                || !Objects.equals(topic.getAssignedCouncil().getCouncilId(), councilId)) {
            throw new IllegalStateException("Topic " + topicId + " is not assigned to council " + councilId);
        }
        if (topic.getTopicStatus() != TopicStatus.PENDING_COUNCIL) {
            throw new IllegalStateException(
                    "Only topics in PENDING_COUNCIL status can be unassigned from a council. Current: "
                            + topic.getTopicStatus());
        }
        topic.setAssignedCouncil(null);
        topic.setTopicStatus(TopicStatus.DEPT_APPROVED);
        topicRepository.save(topic);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkCouncilReadiness(Long councilId, Long topicId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new EntityNotFoundException("Topic not found with id: " + topicId));
        if (topic.getAssignedCouncil() == null
                || !Objects.equals(topic.getAssignedCouncil().getCouncilId(), councilId)) {
            throw new IllegalStateException("Topic " + topicId + " is not assigned to council " + councilId);
        }

        List<CouncilMember> allMembers = councilMemberRepository.findByCouncilCouncilId(councilId);
        List<CouncilMember> nonSecretaries = allMembers.stream()
                .filter(m -> m.getCouncilRole() != CouncilRole.SECRETARY)
                .toList();

        if (nonSecretaries.isEmpty()) {
            return false;
        }

        long submittedCount = evaluationRepository.countByTopicTopicIdAndCouncilMemberInAndSubmissionStatus(
                topicId, nonSecretaries, SubmissionStatus.SUBMITTED);

        return nonSecretaries.size() == submittedCount;
    }

    @Override
    public CouncilDetailResponse createCouncil(CouncilCreateRequest request) {
        validateMeetingSchedule(request.getMeetingDate(), request.getMeetingTime());

        Council council = Council.builder()
                .councilName(request.getCouncilName())
                .meetingDate(request.getMeetingDate())
                .meetingTime(request.getMeetingTime())
                .meetingLocation(request.getMeetingLocation())
                .build();

        Council saved = councilRepository.save(council);
        return toDetailResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouncilListResponse> getAllCouncils(Pageable pageable) {
        return councilRepository.findAllCouncils(pageable).map(this::toListResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouncilListResponse> getAvailableCouncils(Pageable pageable) {
        LocalDateTime now = LocalDateTime.now();
        return councilRepository
                .findAvailableCouncils(now.toLocalDate(), now.toLocalTime(), pageable)
                .map(this::toListResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CouncilDetailResponse getCouncilById(Long id) {
        Council council = councilRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Council not found with id: " + id));
        return toDetailResponse(council);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TopicListResponse> getExpertTopics(String expertEmail, Pageable pageable) {
        Page<Topic> topics = topicRepository.findTopicsAssignedToExpert(expertEmail, pageable);
        
        return topics.map(topic -> {
            TopicListResponse dto = topicMapper.toListResponse(topic);
            
            if (topic.getAssignedCouncil() != null) {
                dto.setCouncilId(topic.getAssignedCouncil().getCouncilId()); 
                dto.setCouncilName(topic.getAssignedCouncil().getCouncilName());
                
                // [VÁ LỖ HỔNG]: Ánh xạ cờ isSessionActive từ Entity sang DTO
                dto.setSessionActive(topic.isSessionActive());
                
                councilMemberRepository.findByCouncilCouncilIdAndUserEmail(
                        topic.getAssignedCouncil().getCouncilId(), expertEmail)
                    .ifPresent(member -> {
                        dto.setCouncilRole(member.getCouncilRole());
                        dto.setCouncilMemberId(member.getCouncilMemberId());
                    });
            }
            return dto;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public CouncilReadinessResponse getEvaluationStatus(Long councilId, Long topicId) {
        councilRepository.findById(councilId)
                .orElseThrow(() -> new EntityNotFoundException("Council not found with id: " + councilId));
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new EntityNotFoundException("Topic not found with id: " + topicId));
        if (topic.getAssignedCouncil() == null
                || !Objects.equals(topic.getAssignedCouncil().getCouncilId(), councilId)) {
            throw new IllegalStateException("Topic " + topicId + " is not assigned to council " + councilId);
        }

        List<CouncilMember> allMembers = councilMemberRepository.findByCouncilCouncilId(councilId);
        List<CouncilMember> nonSecretaries = allMembers.stream()
                .filter(m -> m.getCouncilRole() != CouncilRole.SECRETARY)
                .toList();

        List<Evaluation> submittedEvals = evaluationRepository
                .findByTopicTopicIdAndCouncilMemberInAndSubmissionStatus(
                        topicId, nonSecretaries, SubmissionStatus.SUBMITTED);

        long submittedCount = submittedEvals.size();

        boolean ready = !nonSecretaries.isEmpty() && nonSecretaries.size() == submittedCount;
        String message = ready
                ? "All evaluations submitted. Council is ready for minute submission."
                : String.format("Waiting for %d more evaluation(s).",
                        nonSecretaries.size() - submittedCount);

        List<CouncilReadinessResponse.EvaluationStatusResponse> evalResponses = submittedEvals.stream()
                .map(eval -> CouncilReadinessResponse.EvaluationStatusResponse.builder()
                        .councilMemberId(eval.getCouncilMember().getCouncilMemberId())
                        .evaluatorFullName(eval.getCouncilMember().getUser().getFullName())
                        .councilRole(eval.getCouncilMember().getCouncilRole().name())
                        .totalScore(eval.getTotalScore())
                        .generalComment(eval.getGeneralComment())
                        .recommendedDecision(eval.getRecommendedDecision())
                        .submissionStatus(eval.getSubmissionStatus().name())
                        .build())
                .toList();

        return CouncilReadinessResponse.builder()
                .councilId(councilId)
                .topicId(topicId)
                .ready(ready)
                .totalNonSecretaries(nonSecretaries.size())
                .submittedCount(submittedCount)
                .averageScore(ready
                        ? submittedEvals.stream()
                        .map(Evaluation::getTotalScore)
                        .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add)
                        .divide(java.math.BigDecimal.valueOf(submittedCount), 2, java.math.RoundingMode.HALF_UP)
                        : null)
                .message(message)
                .evaluations(evalResponses)
                .build();
    }

    private CouncilListResponse toListResponse(Council council) {
        return CouncilListResponse.builder()
                .councilId(council.getCouncilId())
                .councilName(council.getCouncilName())
                .meetingDate(council.getMeetingDate())
                .meetingLocation(council.getMeetingLocation())
                .memberCount(council.getCouncilMembers().size())
                .topicCount(council.getTopics().size())
                .build();
    }

    private CouncilDetailResponse toDetailResponse(Council council) {
        List<CouncilDetailResponse.MemberInfo> memberInfos = council.getCouncilMembers().stream()
                .map(cm -> CouncilDetailResponse.MemberInfo.builder()
                        .councilMemberId(cm.getCouncilMemberId())
                        .userId(cm.getUser().getUserId())
                        .fullName(cm.getUser().getFullName())
                        .email(cm.getUser().getEmail())
                        .councilRole(cm.getCouncilRole())
                        .build())
                .toList();

        List<TopicListResponse> topicResponses = council.getTopics().stream()
                .map(topicMapper::toListResponse)
                .toList();

        return CouncilDetailResponse.builder()
                .councilId(council.getCouncilId())
                .councilName(council.getCouncilName())
                .meetingDate(council.getMeetingDate())
                .meetingTime(council.getMeetingTime())
                .meetingLocation(council.getMeetingLocation())
                .members(memberInfos)
                .topics(topicResponses)
                .build();
    }

    private void validateMeetingSchedule(java.time.LocalDate meetingDate, java.time.LocalTime meetingTime) {
        if (meetingDate == null || meetingTime == null) {
            throw new IllegalArgumentException("Meeting date and time must be provided.");
        }

        LocalDateTime scheduledAt = LocalDateTime.of(meetingDate, meetingTime);
        if (scheduledAt.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Council meeting datetime must be in the present or future.");
        }
    }

    private boolean isCouncilExpired(Council council, LocalDateTime referenceTime) {
        if (council.getMeetingDate() == null || council.getMeetingTime() == null) {
            return false;
        }
        LocalDateTime meetingDateTime = LocalDateTime.of(council.getMeetingDate(), council.getMeetingTime());
        return meetingDateTime.isBefore(referenceTime);
    }
}