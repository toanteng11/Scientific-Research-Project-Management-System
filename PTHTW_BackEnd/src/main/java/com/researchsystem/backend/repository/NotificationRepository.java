package com.researchsystem.backend.repository;

import com.researchsystem.backend.domain.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipient_UserIdOrderByCreatedAtDesc(Long recipientUserId, Pageable pageable);

    long countByRecipient_UserIdAndReadAtIsNull(Long recipientUserId);
}

