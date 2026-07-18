package com.researchsystem.backend.repository;

import com.researchsystem.backend.domain.entity.CouncilMember;
import com.researchsystem.backend.domain.entity.Evaluation;
import com.researchsystem.backend.domain.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    long countByTopicTopicIdAndCouncilMemberInAndSubmissionStatus(
            Long topicId,
            List<CouncilMember> members,
            SubmissionStatus status);

    List<Evaluation> findByTopicTopicIdAndCouncilMemberInAndSubmissionStatus(
            Long topicId,
            List<CouncilMember> members,
            SubmissionStatus status);

    Optional<Evaluation> findByTopicTopicIdAndCouncilMemberCouncilMemberId(Long topicId, Long councilMemberId);
}
