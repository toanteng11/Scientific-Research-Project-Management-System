package com.researchsystem.backend.dto.request;

import com.researchsystem.backend.domain.enums.CouncilRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouncilAssignmentRequest {

    /**
     * Experts to add to the council, each with a concrete {@link CouncilRole}
     * (PRESIDENT, SECRETARY, or MEMBER).
     */
    @NotEmpty(message = "At least one member assignment is required")
    @Valid
    private List<ExpertAssignment> members;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExpertAssignment {

        @NotNull(message = "User ID must not be null")
        private Long userId;

        @NotNull(message = "Council role must not be null")
        private CouncilRole councilRole;
    }
}
