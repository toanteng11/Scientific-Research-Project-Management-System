package com.researchsystem.backend.controller;

import com.researchsystem.backend.dto.request.EvaluationRequest;
import com.researchsystem.backend.dto.response.EvaluationResponse;
import com.researchsystem.backend.service.EvaluationService;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/evaluations")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Evaluations", description = "Individual evaluation score submission by council experts")
public class EvaluationController {

    private final EvaluationService evaluationService;

    @PostMapping
    @PreAuthorize("hasRole('COUNCIL')")
    @Operation(
            summary = "Submit an evaluation score for a topic by a council member",
            description = "COUNCIL expert submits scored evaluation across seven criteria. " +
                          "The totalScore is computed automatically as the sum of individual scores. " +
                          "Each council member may only submit one evaluation per topic."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Evaluation submitted successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — validation error on scores or missing fields"),
            @ApiResponse(responseCode = "403", description = "Forbidden — COUNCIL role required"),
            @ApiResponse(responseCode = "409", description = "Conflict — evaluation already submitted for this council member")
    })
    public ResponseEntity<EvaluationResponse> submitEvaluation(
            @Valid @RequestBody EvaluationRequest request,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(evaluationService.submitEvaluation(request, principal.getName()));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('COUNCIL')")
    @Operation(
            summary = "Retrieve the authenticated member's evaluation for a topic",
            description = "Returns the existing evaluation if one has been submitted or drafted. " +
                          "Used to restore form state on page reload and enforce post-submission immutability."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Evaluation found and returned"),
            @ApiResponse(responseCode = "204", description = "No evaluation exists yet for this member/topic"),
            @ApiResponse(responseCode = "403", description = "Forbidden — ownership mismatch or COUNCIL role required")
    })
    public ResponseEntity<EvaluationResponse> getMyEvaluation(
            @RequestParam("topicId") Long topicId,
            @RequestParam("councilMemberId") Long councilMemberId,
            @Parameter(hidden = true) Principal principal) {
        return evaluationService.getMyEvaluation(topicId, councilMemberId, principal.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
