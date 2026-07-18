package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.entity.Notification;
import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.dto.response.NotificationResponse;
import com.researchsystem.backend.repository.NotificationRepository;
import com.researchsystem.backend.repository.UserRepository;
import com.researchsystem.backend.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(user.getUserId(), pageable)
                .map(NotificationServiceImpl::toResponse);
    }

    @Override
    @Transactional
    public NotificationResponse markRead(String email, Long notificationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));

        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found with id: " + notificationId));

        if (!n.getRecipient().getUserId().equals(user.getUserId())) {
            throw new org.springframework.security.access.AccessDeniedException("Not allowed to modify this notification");
        }

        if (n.getReadAt() == null) {
            n.setReadAt(LocalDateTime.now());
            n = notificationRepository.save(n);
        }
        return toResponse(n);
    }

    @Override
    @Transactional
    public int markAllRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        int updated = 0;
        Page<Notification> page = notificationRepository.findByRecipient_UserIdOrderByCreatedAtDesc(
                user.getUserId(), Pageable.unpaged());
        for (Notification n : page) {
            if (n.getReadAt() == null) {
                n.setReadAt(LocalDateTime.now());
                updated++;
            }
        }
        notificationRepository.saveAll(page.getContent());
        return updated;
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return notificationRepository.countByRecipient_UserIdAndReadAtIsNull(user.getUserId());
    }

    static NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .notificationType(n.getNotificationType())
                .title(n.getTitle())
                .body(n.getBody())
                .resourceType(n.getResourceType())
                .resourceId(n.getResourceId())
                .createdAt(n.getCreatedAt())
                .readAt(n.getReadAt())
                .build();
    }
}

