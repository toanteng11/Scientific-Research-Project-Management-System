package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.enums.TopicStatus;
import com.researchsystem.backend.dto.response.SummaryStatsResponse;
import com.researchsystem.backend.repository.CouncilRepository;
import com.researchsystem.backend.repository.TopicRepository;
import com.researchsystem.backend.repository.UserRepository;
import com.researchsystem.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsServiceImpl implements StatsService {

    private final TopicRepository topicRepository;
    private final CouncilRepository councilRepository;
    private final UserRepository userRepository;

    @Override
    public SummaryStatsResponse getSummary() {
        long draft = topicRepository.countByTopicStatus(TopicStatus.DRAFT);
        long pendingReview = topicRepository.countByTopicStatus(TopicStatus.PENDING_REVIEW);
        long deptApproved = topicRepository.countByTopicStatus(TopicStatus.DEPT_APPROVED);
        long deptRejected = topicRepository.countByTopicStatus(TopicStatus.DEPT_REJECTED);
        long pendingCouncil = topicRepository.countByTopicStatus(TopicStatus.PENDING_COUNCIL);
        long councilReviewed = topicRepository.countByTopicStatus(TopicStatus.COUNCIL_REVIEWED);
        long revisionRequired = topicRepository.countByTopicStatus(TopicStatus.REVISION_REQUIRED);
        long approved = topicRepository.countByTopicStatus(TopicStatus.APPROVED);
        long rejected = topicRepository.countByTopicStatus(TopicStatus.REJECTED);

        long pendingTotal = pendingReview + pendingCouncil + revisionRequired;

        return SummaryStatsResponse.builder()
                .topicsDraft(draft)
                .topicsPendingReview(pendingReview)
                .topicsDeptApproved(deptApproved)
                .topicsDeptRejected(deptRejected)
                .topicsPendingCouncil(pendingCouncil)
                .topicsCouncilReviewed(councilReviewed)
                .topicsRevisionRequired(revisionRequired)
                .topicsApproved(approved)
                .topicsRejected(rejected)
                .topicsPendingTotal(pendingTotal)
                .totalCouncils(councilRepository.count())
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByActiveTrue())
                .build();
    }
}
