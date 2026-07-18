package com.researchsystem.backend.controller;

import com.researchsystem.backend.dto.response.ReferenceEnumsResponse;
import com.researchsystem.backend.service.ReferenceDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reference")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Reference data", description = "Canonical enum values for UI dropdowns and validation")
public class ReferenceController {

    private final ReferenceDataService referenceDataService;

    @GetMapping("/enums")
    @Operation(summary = "List system enumeration values",
            description = "Returns stable enum names for topic workflow, roles, and related domains.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Enumerations returned"),
            @ApiResponse(responseCode = "403", description = "Forbidden — authentication required")
    })
    public ResponseEntity<ReferenceEnumsResponse> getEnums() {
        return ResponseEntity.ok(referenceDataService.getAllEnums());
    }
}
