package com.researchsystem.backend.service;

import com.researchsystem.backend.dto.response.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    Page<NotificationResponse> getMyNotifications(String email, Pageable pageable);

    NotificationResponse markRead(String email, Long notificationId);

    int markAllRead(String email);

    long getUnreadCount(String email);
}

