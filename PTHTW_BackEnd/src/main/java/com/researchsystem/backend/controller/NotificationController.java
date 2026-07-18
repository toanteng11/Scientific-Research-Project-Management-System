package com.researchsystem.backend.controller;

import com.researchsystem.backend.dto.response.NotificationResponse;
import com.researchsystem.backend.dto.response.UnreadCountResponse;
import com.researchsystem.backend.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Notifications", description = "In-app notification inbox for business events")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/me")
    @Operation(summary = "List my notifications (paginated)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Notifications returned"),
            @ApiResponse(responseCode = "403", description = "Forbidden — authentication required")
    })
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(
            @ParameterObject @PageableDefault(size = 20) Pageable pageable,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(notificationService.getMyNotifications(principal.getName(), pageable));
    }

    @GetMapping("/me/unread-count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(UnreadCountResponse.builder()
                .unreadCount(notificationService.getUnreadCount(principal.getName()))
                .build());
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a notification as read")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Notification marked read"),
            @ApiResponse(responseCode = "404", description = "Notification not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<NotificationResponse> markRead(
            @PathVariable("id") Long id,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(notificationService.markRead(principal.getName(), id));
    }

    @PatchMapping("/me/read-all")
    @Operation(summary = "Mark all my notifications as read")
    public ResponseEntity<Void> markAllRead(@Parameter(hidden = true) Principal principal) {
        notificationService.markAllRead(principal.getName());
        return ResponseEntity.noContent().build();
    }
}

