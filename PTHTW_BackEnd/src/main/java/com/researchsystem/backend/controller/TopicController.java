package com.researchsystem.backend.controller;

import com.researchsystem.backend.dto.request.TopicCreationRequest;
import com.researchsystem.backend.dto.request.TopicStatusChangeRequest;
import com.researchsystem.backend.dto.request.UpdateTopicRequest;
import com.researchsystem.backend.dto.response.AttachmentDownloadPayload;
import com.researchsystem.backend.dto.response.AttachmentResponse;
import com.researchsystem.backend.dto.response.AuditLogResponse;
import com.researchsystem.backend.dto.response.TopicDetailResponse;
import com.researchsystem.backend.dto.response.TopicListResponse;
import com.researchsystem.backend.service.TopicService;
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
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Topics", description = "Research topic lifecycle management — creation, review, and evaluation workflow")
public class TopicController {

    private final TopicService topicService;

    // -----------------------------------------------------------------------
    // RESEARCHER: Create & manage own topics
    // -----------------------------------------------------------------------

    @PostMapping("/")
    @PreAuthorize("hasRole('RESEARCHER')")
    @Operation(
            summary = "Create a new research topic",
            description = "RESEARCHER creates a new topic in DRAFT status. " +
                          "The authenticated user becomes the principal investigator."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Topic created in DRAFT status"),
            @ApiResponse(responseCode = "400", description = "Bad Request — validation error on payload"),
            @ApiResponse(responseCode = "403", description = "Forbidden — RESEARCHER role required")
    })
    public ResponseEntity<TopicDetailResponse> createTopic(
            @Valid @RequestBody TopicCreationRequest request,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(topicService.createTopic(request, principal.getName()));
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('RESEARCHER')")
    @Operation(
            summary = "Upload a file attachment to a topic",
            description = "RESEARCHER uploads a supporting document. " +
                          "The topic's file version counter is incremented on each upload."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Attachment stored successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — missing file or invalid topic"),
            @ApiResponse(responseCode = "403", description = "Forbidden — RESEARCHER role required")
    })
    public ResponseEntity<AttachmentResponse> uploadAttachment(
            @PathVariable("id") Long id,
            @RequestParam("file") MultipartFile file,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(topicService.uploadAttachment(id, file, principal.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('RESEARCHER')")
    @Operation(
            summary = "Update mutable fields of a DRAFT topic",
            description = "RESEARCHER may update topic metadata (title, type, field, duration, budget) " +
                          "only while the topic remains in DRAFT status."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Topic updated successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — validation error"),
            @ApiResponse(responseCode = "403", description = "Forbidden — RESEARCHER role required"),
            @ApiResponse(responseCode = "409", description = "Conflict — topic is no longer in DRAFT status")
    })
    public ResponseEntity<TopicDetailResponse> updateTopic(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateTopicRequest request,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(topicService.updateTopic(id, request, principal.getName()));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('RESEARCHER')")
    @Operation(
            summary = "List topics owned by the authenticated researcher",
            description = "Returns a paginated list of all topics where the authenticated user is the principal investigator."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Topic list returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — invalid pagination parameters"),
            @ApiResponse(responseCode = "403", description = "Forbidden — RESEARCHER role required")
    })
    public ResponseEntity<Page<TopicListResponse>> getMyTopics(
            @ParameterObject @PageableDefault(size = 20) Pageable pageable,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(topicService.getTopicsByInvestigator(principal.getName(), pageable));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESEARCHER')")
    @Operation(
            summary = "Delete a DRAFT topic",
            description = "Permanently removes a topic. Only topics in DRAFT status may be deleted."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Topic deleted successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "403", description = "Forbidden — RESEARCHER role required"),
            @ApiResponse(responseCode = "409", description = "Conflict — topic is not in DRAFT status")
    })
    public ResponseEntity<Void> deleteTopic(
            @PathVariable("id") Long id,
            @Parameter(hidden = true) Principal principal) {
        topicService.deleteTopic(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('RESEARCHER','DEPT_HEAD','MANAGER','ADMIN')")
    @Operation(
            summary = "Transition topic status (unified workflow endpoint)",
            description = "Applies a legal finite-state-machine transition with strict role checks: " +
                          "RESEARCHER (owner) for submission / revision; DEPT_HEAD (same department) for " +
                          "departmental review; MANAGER for manager/council-stage transitions; ADMIN may perform any transition."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — invalid payload"),
            @ApiResponse(responseCode = "403", description = "Forbidden — role not permitted for this transition"),
            @ApiResponse(responseCode = "409", description = "Conflict — invalid state transition")
    })
    public ResponseEntity<TopicDetailResponse> changeTopicStatus(
            @PathVariable("id") Long id,
            @Valid @RequestBody TopicStatusChangeRequest request,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(topicService.changeTopicStatus(id, request, principal.getName()));
    }

    // -----------------------------------------------------------------------
    // MANAGER: Manager-level review and council assignment
    // -----------------------------------------------------------------------

    @GetMapping("/")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(
            summary = "List all research topics (paginated)",
            description = "Returns a paginated view of every topic in the system, accessible by MANAGER and ADMIN."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Topic list returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — invalid pagination parameters"),
            @ApiResponse(responseCode = "403", description = "Forbidden — MANAGER or ADMIN role required")
    })
    public ResponseEntity<Page<TopicListResponse>> getAllTopics(
            @ParameterObject @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(topicService.getAllTopics(pageable));
    }

    // -----------------------------------------------------------------------
    // All authenticated users: topic detail and audit trail
    // -----------------------------------------------------------------------

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESEARCHER','DEPT_HEAD','MANAGER','ADMIN','COUNCIL')")
    @Operation(
            summary = "Get topic details",
            description = "Returns the full detail view of a topic including research metadata. " +
                          "Access is enforced by role and ownership: ADMIN/MANAGER (full), DEPT_HEAD (same department), " +
                          "COUNCIL (member of assigned council), RESEARCHER (principal investigator only)."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Topic detail returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "403", description = "Forbidden — insufficient privilege or wrong ownership context")
    })
    public ResponseEntity<TopicDetailResponse> getTopicById(
            @PathVariable("id") Long id,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(topicService.getTopicById(id, principal.getName()));
    }

    @GetMapping("/{id}/audit-logs")
    @Operation(
            summary = "Get audit trail for a topic",
            description = "Returns the full chronological audit log showing every status transition " +
                          "with actor name, timestamp, and optional feedback notes."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Audit log returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "403", description = "Forbidden — authentication required")
    })
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs(
            @PathVariable("id") Long id,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(topicService.getAuditLogs(id, principal.getName()));
    }

    // -----------------------------------------------------------------------
    // COUNCIL: Score-related queries
    // -----------------------------------------------------------------------

    @GetMapping("/{id}/average-score")
    @PreAuthorize("hasRole('COUNCIL')")
    @Operation(
            summary = "Get the calculated average evaluation score for a topic",
            description = "Computes and returns the average totalScore across all SUBMITTED evaluations " +
                          "from non-secretary council members. Only accessible by COUNCIL members."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Average score returned successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — no submitted evaluations yet"),
            @ApiResponse(responseCode = "403", description = "Forbidden — COUNCIL role required")
    })
    public ResponseEntity<BigDecimal> getAverageScore(@PathVariable("id") Long id) {
        return ResponseEntity.ok(topicService.getAverageScore(id));
    }
    
    @GetMapping("/{id}/attachments/{attachmentId}")
    @Operation(
            summary = "Download a specific attachment",
            description = "Streams a stored file for reviewers and stakeholders: MANAGER/ADMIN, " +
                          "the principal investigator, the department head of the managing department, " +
                          "or council members assigned to the topic's council."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "File downloaded successfully"),
            @ApiResponse(responseCode = "404", description = "Topic or attachment not found"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable("id") Long topicId,
            @PathVariable("attachmentId") Long attachmentId,
            @Parameter(hidden = true) Principal principal) {

        AttachmentDownloadPayload payload = topicService.loadAttachmentForDownload(
                topicId, attachmentId, principal.getName());

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            mediaType = MediaType.parseMediaType(payload.getContentType());
        } catch (Exception ignored) {
            // keep OCTET_STREAM
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + payload.getFilename() + "\"")
                .body(payload.getResource());
    }
}
