package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.entity.AuditLog;
import com.researchsystem.backend.domain.entity.Topic;
import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.domain.enums.TopicStatus;
import com.researchsystem.backend.repository.AuditLogRepository;
import com.researchsystem.backend.repository.TopicRepository;
import com.researchsystem.backend.repository.UserRepository;
import com.researchsystem.backend.service.AuditLogService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;

    @Override
    public void recordLog(Long topicId,
                          TopicStatus previousStatus,
                          TopicStatus newStatus,
                          String feedback,
                          String actorEmail) {

        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Topic not found with id: " + topicId));

        User actor = userRepository.findByEmail(actorEmail)
                .orElseThrow(() -> new EntityNotFoundException(
                        "User not found with email: " + actorEmail));

        AuditLog log = AuditLog.builder()
                .topic(topic)
                .actor(actor)
                .previousStatus(previousStatus != null ? previousStatus.name() : null)
                .newStatus(newStatus.name())
                .feedbackMessage(feedback)
                .build();

        auditLogRepository.save(log);
    }
}
