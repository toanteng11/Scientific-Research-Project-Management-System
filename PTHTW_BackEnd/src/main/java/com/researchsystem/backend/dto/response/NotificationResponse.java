package com.researchsystem.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {

    private Long notificationId;
    private String notificationType;
    private String title;
    private String body;
    private String resourceType;
    private Long resourceId;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}

