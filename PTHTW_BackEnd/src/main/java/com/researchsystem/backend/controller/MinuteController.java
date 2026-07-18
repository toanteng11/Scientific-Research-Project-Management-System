package com.researchsystem.backend.controller;

import com.researchsystem.backend.dto.request.MinuteApprovalRequest;
import com.researchsystem.backend.dto.request.MinuteRequest;
import com.researchsystem.backend.dto.response.MinuteResponse;
import com.researchsystem.backend.service.MinuteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

/**
 * Workflow endpoints for the Council Meeting Minute document.
 *
 * Segregates the dual-actor orchestration:
 *   * POST  /api/v1/minutes/draft             — SECRETARY saves a working draft
 *   * PATCH /api/v1/minutes/{id}/approve      — PRESIDENT approves & publishes
 *   * PATCH /api/v1/minutes/{id}/return       — PRESIDENT returns to secretary
 *
 * The legacy POST /api/v1/minutes is kept for backward compatibility: it
 * routes to the correct flow based on the caller's council role.
 */
@RestController
@RequestMapping("/api/v1/minutes")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Meeting Minutes",
        description = "Drafting (Secretary) and approval/publishing (President) of council meeting minutes")
public class MinuteController {

    private final MinuteService minuteService;

    // ------------------------------------------------------------------------
    // LEGACY — kept for backward compatibility with older clients.
    // New clients should use /draft and /{id}/approve instead.
    // ------------------------------------------------------------------------
    @PostMapping
    @PreAuthorize("hasRole('COUNCIL')")
    @Operation(
            summary = "[Legacy] Submit or approve minute based on caller role",
            description = "Delegates to /draft for SECRETARY or auto-approves an existing draft " +
                    "for PRESIDENT. New integrations should call /draft and /{id}/approve explicitly."
    )
    public ResponseEntity<MinuteResponse> submitMinute(
            @Valid @RequestBody MinuteRequest request,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(minuteService.submitMinute(request, principal.getName()));
    }

    // ------------------------------------------------------------------------
    // SECRETARY — save a working draft
    // ------------------------------------------------------------------------
    @PostMapping("/draft")
    @PreAuthorize("hasRole('COUNCIL')")
    @Operation(
            summary = "Secretary saves (or overwrites) a draft minute for a topic",
            description = "Sets MinuteStatus to DRAFT. Does NOT transition the topic FSM and " +
                    "does NOT trigger lifecycle notifications. Requires all evaluations to be submitted."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Draft saved"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "403", description = "Not the council secretary"),
            @ApiResponse(responseCode = "409", description = "Not all evaluations submitted")
    })
    public ResponseEntity<MinuteResponse> draftMinute(
            @Valid @RequestBody MinuteRequest request,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(minuteService.draftMinute(request, principal.getName()));
    }

    // ------------------------------------------------------------------------
    // PRESIDENT — approve & publish a draft
    // ------------------------------------------------------------------------
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('COUNCIL')")
    @Operation(
            summary = "President approves & publishes a draft minute",
            description = "Transitions MinuteStatus DRAFT → PUBLISHED, fires Topic macro-FSM " +
                    "transition (APPROVED / REVISION_REQUIRED / REJECTED), and publishes the " +
                    "TopicStatusChangedEvent for async SMTP notifications."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Minute published"),
            @ApiResponse(responseCode = "400", description = "Validation error or no concrete decision"),
            @ApiResponse(responseCode = "403", description = "Not the council president"),
            @ApiResponse(responseCode = "404", description = "Minute not found"),
            @ApiResponse(responseCode = "409", description = "Minute not in DRAFT state")
    })
    public ResponseEntity<MinuteResponse> approveMinute(
            @PathVariable("id") Long minuteId,
            @Valid @RequestBody MinuteApprovalRequest request,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(
                minuteService.approveMinute(minuteId, request, principal.getName()));
    }

    // ------------------------------------------------------------------------
    // PRESIDENT — return draft to secretary
    // ------------------------------------------------------------------------
    @PatchMapping("/{id}/return")
    @PreAuthorize("hasRole('COUNCIL')")
    @Operation(
            summary = "President returns a draft minute to the Secretary for revision",
            description = "Transitions MinuteStatus DRAFT → RETURNED_TO_SECRETARY. Topic FSM is untouched."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Minute returned to secretary"),
            @ApiResponse(responseCode = "403", description = "Not the council president"),
            @ApiResponse(responseCode = "404", description = "Minute not found"),
            @ApiResponse(responseCode = "409", description = "Minute not in DRAFT state")
    })
    public ResponseEntity<MinuteResponse> returnMinute(
            @PathVariable("id") Long minuteId,
            @RequestBody(required = false) Map<String, String> body,
            @Parameter(hidden = true) Principal principal) {
        String reason = body == null ? null : body.get("reason");
        return ResponseEntity.ok(
                minuteService.returnMinute(minuteId, reason, principal.getName()));
    }

    @GetMapping("/topic/{topicId}")
    @PreAuthorize("hasAnyRole('RESEARCHER','MANAGER','ADMIN','COUNCIL')")
    @Operation(
            summary = "Get meeting minutes for a topic",
            description = "Principal investigators may read minutes for their own topics once a council is assigned. " +
                    "MANAGER and ADMIN may read minutes for any topic."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Minutes returned"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Topic, council, or minutes not found")
    })
    public ResponseEntity<MinuteResponse> getMinuteForTopic(
            @PathVariable("topicId") Long topicId,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(minuteService.getMinuteForTopic(topicId, principal.getName()));
    }
}
