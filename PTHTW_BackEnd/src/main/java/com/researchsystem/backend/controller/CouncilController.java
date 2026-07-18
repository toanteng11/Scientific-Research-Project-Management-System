package com.researchsystem.backend.controller;

import com.researchsystem.backend.dto.request.AssignTopicsRequest;
import com.researchsystem.backend.dto.request.CouncilAssignmentRequest;
import com.researchsystem.backend.dto.request.CouncilCreateRequest;
import com.researchsystem.backend.dto.request.CouncilCreationWithAssignmentRequest;
import com.researchsystem.backend.dto.response.CouncilDetailResponse;
import com.researchsystem.backend.dto.response.CouncilListResponse;
import com.researchsystem.backend.dto.response.CouncilReadinessResponse;
import com.researchsystem.backend.dto.response.TopicListResponse;
import com.researchsystem.backend.service.CouncilService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/councils")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Councils", description = "Evaluation council creation, membership assignment, and readiness tracking")
public class CouncilController {

    private final CouncilService councilService;

    // ============================================================================
    // GIAO DỊCH PHỨC HỢP: TẠO HỘI ĐỒNG + GÁN THÀNH VIÊN + GIAO ĐỀ TÀI
    // ============================================================================
    @PostMapping("/create-and-assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(
            summary = "Tạo mới hội đồng và phân công thành viên, đề tài trong một giao dịch duy nhất",
            description = "MANAGER thực hiện tạo hội đồng, gán vai trò và giao đề tài. Đảm bảo tính nguyên tử."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Hội đồng được tạo và phân công thành công"),
            @ApiResponse(responseCode = "400", description = "Lỗi xác thực dữ liệu gửi lên"),
            @ApiResponse(responseCode = "403", description = "Forbidden — Yêu cầu quyền MANAGER hoặc ADMIN")
    })
    public ResponseEntity<CouncilDetailResponse> createAndAssignCouncil(
            @Valid @RequestBody CouncilCreationWithAssignmentRequest request,
            @Parameter(hidden = true) Principal principal) {
        CouncilDetailResponse response = councilService.createAndAssign(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    // ============================================================================

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(
            summary = "Create a new evaluation council",
            description = "MANAGER or ADMIN creates an evaluation council with meeting schedule metadata. " +
                          "Members and topics are assigned in subsequent calls."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Council created successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — validation error on payload"),
            @ApiResponse(responseCode = "403", description = "Forbidden — MANAGER or ADMIN role required")
    })
    public ResponseEntity<CouncilDetailResponse> createCouncil(@Valid @RequestBody CouncilCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(councilService.createCouncil(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'COUNCIL')")
    @Operation(
            summary = "List all evaluation councils (paginated)",
            description = "Returns a paginated summary of all councils including member and topic counts. " +
                          "Accessible by MANAGER, ADMIN and COUNCIL."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Council list returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — invalid pagination parameters"),
            @ApiResponse(responseCode = "403", description = "Forbidden — authentication required")
    })
    public ResponseEntity<Page<CouncilListResponse>> getAllCouncils(
            @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(councilService.getAllCouncils(pageable));
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(
            summary = "List councils available for new topic assignment",
            description = "Returns councils whose scheduled datetime has not passed yet."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Available councils returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — invalid pagination parameters"),
            @ApiResponse(responseCode = "403", description = "Forbidden — MANAGER or ADMIN role required")
    })
    public ResponseEntity<Page<CouncilListResponse>> getAvailableCouncils(
            @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(councilService.getAvailableCouncils(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'COUNCIL')")
    @Operation(
            summary = "Get full details of a council",
            description = "Returns complete council information including all members with roles " +
                          "and all assigned topics. Accessible by all authenticated users involved in councils."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Council detail returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "403", description = "Forbidden — authentication required")
    })
    public ResponseEntity<CouncilDetailResponse> getCouncilById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(councilService.getCouncilById(id));
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(
            summary = "Assign expert members to a council with roles",
            description = "MANAGER assigns experts with explicit PRESIDENT, SECRETARY, or MEMBER council roles. " +
                          "Each user must have system role COUNCIL. At most one PRESIDENT and one SECRETARY per council. " +
                          "Enforces uniqueness and the investigator-exclusion rule."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Members assigned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — duplicate IDs or investigator-exclusion violation"),
            @ApiResponse(responseCode = "403", description = "Forbidden — MANAGER role required")
    })
    public ResponseEntity<Void> assignMembers(
            @PathVariable("id") Long id,
            @Valid @RequestBody CouncilAssignmentRequest request) {
        councilService.assignCouncilMembers(id, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(
            summary = "Remove a member from a council",
            description = "MANAGER removes a mistakenly assigned expert from the council roster."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Member removed"),
            @ApiResponse(responseCode = "404", description = "Council or membership not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden — MANAGER role required")
    })
    public ResponseEntity<Void> removeMember(
            @PathVariable("id") Long councilId,
            @PathVariable("userId") Long userId) {
        councilService.removeCouncilMember(councilId, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/topics/{topicId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(
            summary = "Unassign a topic from a council",
            description = "MANAGER removes a topic from this council and returns it to DEPT_APPROVED status. " +
                          "Only allowed while the topic is in PENDING_COUNCIL status."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Topic unassigned"),
            @ApiResponse(responseCode = "404", description = "Council or topic not found"),
            @ApiResponse(responseCode = "409", description = "Conflict — topic not in PENDING_COUNCIL or not on this council"),
            @ApiResponse(responseCode = "403", description = "Forbidden — MANAGER role required")
    })
    public ResponseEntity<Void> removeTopicFromCouncil(
            @PathVariable("id") Long councilId,
            @PathVariable("topicId") Long topicId) {
        councilService.removeTopicFromCouncil(councilId, topicId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/topics")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(
            summary = "Assign DEPT_APPROVED topics to a council for evaluation",
            description = "MANAGER assigns a batch of department-approved topics to this council. " +
                          "Each topic's status transitions from DEPT_APPROVED → PENDING_COUNCIL."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Topics assigned to council successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — a topic is not in DEPT_APPROVED status"),
            @ApiResponse(responseCode = "403", description = "Forbidden — MANAGER role required")
    })
    public ResponseEntity<Void> assignTopics(
            @PathVariable("id") Long id,
            @Valid @RequestBody AssignTopicsRequest request,
            @Parameter(hidden = true) Principal principal) {
        councilService.assignTopics(id, request, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/topics")
    @PreAuthorize("hasRole('COUNCIL')")
    @Operation(
            summary = "Expert views all topics assigned to their councils",
            description = "Returns all research topics that belong to any council the authenticated " +
                          "COUNCIL expert is a member of."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Assigned topics returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — invalid pagination parameters"),
            @ApiResponse(responseCode = "403", description = "Forbidden — COUNCIL role required")
    })
    public ResponseEntity<Page<TopicListResponse>> getMyTopics(
            @ParameterObject @PageableDefault(size = 20) Pageable pageable,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(councilService.getExpertTopics(principal.getName(), pageable));
    }

    @GetMapping("/{id}/evaluations/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'COUNCIL')")
    @Operation(
            summary = "Check evaluation readiness status of a council",
            description = "Returns a readiness summary showing how many non-secretary members have " +
                          "submitted their evaluations and whether the council is ready for minute submission."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Readiness status returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "403", description = "Forbidden — MANAGER or COUNCIL role required")
    })
    public ResponseEntity<CouncilReadinessResponse> getEvaluationStatus(
            @PathVariable("id") Long id,
            @RequestParam("topicId") Long topicId) {
        return ResponseEntity.ok(councilService.getEvaluationStatus(id, topicId));
    }

    @PostMapping("/topics/{topicId}/session/start")
    @PreAuthorize("hasRole('COUNCIL')")
    @Operation(
            summary = "President starts the meeting session for a topic",
            description = "Only the president assigned to the topic's council can activate the session. " +
                          "Session activation unlocks evaluation submission for non-secretary members."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Session started successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — schedule/quorum guard not satisfied"),
            @ApiResponse(responseCode = "403", description = "Forbidden — only president of assigned council can start"),
            @ApiResponse(responseCode = "404", description = "Topic not found")
    })
    public ResponseEntity<Void> startTopicSession(
            @PathVariable("topicId") Long topicId,
            @Parameter(hidden = true) Principal principal) {
        councilService.startTopicSession(topicId, principal.getName());
        return ResponseEntity.noContent().build();
    }
}