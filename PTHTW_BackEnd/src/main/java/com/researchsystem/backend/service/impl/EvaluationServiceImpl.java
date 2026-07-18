package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.entity.CouncilMember;
import com.researchsystem.backend.domain.entity.Evaluation;
import com.researchsystem.backend.domain.entity.Topic;
import com.researchsystem.backend.domain.enums.SubmissionStatus;
import com.researchsystem.backend.dto.request.EvaluationRequest;
import com.researchsystem.backend.dto.response.EvaluationResponse;
import com.researchsystem.backend.repository.CouncilMemberRepository;
import com.researchsystem.backend.repository.EvaluationRepository;
import com.researchsystem.backend.repository.TopicRepository;
import com.researchsystem.backend.service.EvaluationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class EvaluationServiceImpl implements EvaluationService {

    private final EvaluationRepository evaluationRepository;
    private final CouncilMemberRepository councilMemberRepository;
    private final TopicRepository topicRepository;

    @Override
    public EvaluationResponse submitEvaluation(EvaluationRequest request, String actorEmail) {
        CouncilMember member = councilMemberRepository.findById(request.getCouncilMemberId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Council member not found with id: " + request.getCouncilMemberId()));

        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Topic not found with id: " + request.getTopicId()));

        if (topic.getAssignedCouncil() == null) {
            throw new IllegalStateException("Topic is not assigned to a council yet");
        }
        if (!topic.getAssignedCouncil().getCouncilId().equals(member.getCouncil().getCouncilId())) {
            throw new IllegalStateException("Council member does not belong to the topic's assigned council");
        }
        if (!member.getUser().getEmail().equalsIgnoreCase(actorEmail)) {
            throw new AccessDeniedException("Authenticated user cannot submit on behalf of another council member");
        }
        if (member.getCouncilRole() == com.researchsystem.backend.domain.enums.CouncilRole.SECRETARY) {
            throw new AccessDeniedException("Secretary is not allowed to submit evaluation forms.");
        }
        if (!topic.isSessionActive()) {
            throw new IllegalStateException("Evaluation session has not been activated by secretary.");
        }

        Optional<Evaluation> existing = evaluationRepository
                .findByTopicTopicIdAndCouncilMemberCouncilMemberId(topic.getTopicId(), member.getCouncilMemberId());

        if (existing.isPresent() && existing.get().getSubmissionStatus() == SubmissionStatus.SUBMITTED) {
            throw new IllegalStateException(
                    "Evaluation already submitted for council member id: " + member.getCouncilMemberId());
        }

        BigDecimal total = request.getScoreUrgency()
                .add(request.getScoreContent())
                .add(request.getScoreObjectives())
                .add(request.getScoreMethodology())
                .add(request.getScoreFeasibility())
                .add(request.getScoreCapacity())
                .add(request.getScoreProducts());

        Evaluation evaluation = existing.map(e -> {
            e.setTopic(topic);
            e.setScoreUrgency(request.getScoreUrgency());
            e.setScoreContent(request.getScoreContent());
            e.setScoreObjectives(request.getScoreObjectives());
            e.setScoreMethodology(request.getScoreMethodology());
            e.setScoreFeasibility(request.getScoreFeasibility());
            e.setScoreCapacity(request.getScoreCapacity());
            e.setScoreProducts(request.getScoreProducts());
            e.setTotalScore(total);
            e.setGeneralComment(request.getGeneralComment());
            e.setRecommendedDecision(request.getRecommendedDecision());
            e.setSubmissionStatus(SubmissionStatus.SUBMITTED);
            return e;
        }).orElseGet(() -> Evaluation.builder()
                .councilMember(member)
                .topic(topic)
                .scoreUrgency(request.getScoreUrgency())
                .scoreContent(request.getScoreContent())
                .scoreObjectives(request.getScoreObjectives())
                .scoreMethodology(request.getScoreMethodology())
                .scoreFeasibility(request.getScoreFeasibility())
                .scoreCapacity(request.getScoreCapacity())
                .scoreProducts(request.getScoreProducts())
                .totalScore(total)
                .generalComment(request.getGeneralComment())
                .recommendedDecision(request.getRecommendedDecision())
                .submissionStatus(SubmissionStatus.SUBMITTED)
                .build());

        Evaluation saved = evaluationRepository.save(evaluation);
        return toEvaluationResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<EvaluationResponse> getMyEvaluation(Long topicId, Long councilMemberId, String actorEmail) {
        CouncilMember member = councilMemberRepository.findById(councilMemberId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Council member not found with id: " + councilMemberId));

        if (!member.getUser().getEmail().equalsIgnoreCase(actorEmail)) {
            throw new AccessDeniedException("Authenticated user does not own this council membership");
        }
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new EntityNotFoundException("Topic not found with id: " + topicId));


        return evaluationRepository
                .findByTopicTopicIdAndCouncilMemberCouncilMemberId(topicId, councilMemberId)
                .map(this::toEvaluationResponse);
    }

    private EvaluationResponse toEvaluationResponse(Evaluation eval) {
        return EvaluationResponse.builder()
                .evaluationId(eval.getEvaluationId())
                .councilMemberId(eval.getCouncilMember().getCouncilMemberId())
                .topicId(eval.getTopic().getTopicId())
                .evaluatorFullName(eval.getCouncilMember().getUser().getFullName())
                .scoreUrgency(eval.getScoreUrgency())
                .scoreContent(eval.getScoreContent())
                .scoreObjectives(eval.getScoreObjectives())
                .scoreMethodology(eval.getScoreMethodology())
                .scoreFeasibility(eval.getScoreFeasibility())
                .scoreCapacity(eval.getScoreCapacity())
                .scoreProducts(eval.getScoreProducts())
                .totalScore(eval.getTotalScore())
                .generalComment(eval.getGeneralComment())
                .recommendedDecision(eval.getRecommendedDecision())
                .submissionStatus(eval.getSubmissionStatus())
                .build();
    }
}
