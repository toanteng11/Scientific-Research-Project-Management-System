package com.researchsystem.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class CouncilCreationWithAssignmentRequest {
    @NotNull
    @Valid
    private CouncilCreateRequest councilInfo;

    @NotEmpty
    @Valid
    private List<CouncilAssignmentRequest.ExpertAssignment> members;

    @NotNull
    private Long topicId;
}