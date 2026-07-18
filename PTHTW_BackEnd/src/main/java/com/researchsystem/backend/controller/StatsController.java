package com.researchsystem.backend.controller;

import com.researchsystem.backend.dto.response.SummaryStatsResponse;
import com.researchsystem.backend.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Statistics", description = "Aggregate metrics for management dashboards")
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(
            summary = "Dashboard summary counts",
            description = "Returns aggregate topic status counts, council totals, and user totals."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Summary returned"),
            @ApiResponse(responseCode = "403", description = "Forbidden — MANAGER or ADMIN required")
    })
    public ResponseEntity<SummaryStatsResponse> getSummary() {
        return ResponseEntity.ok(statsService.getSummary());
    }
}
