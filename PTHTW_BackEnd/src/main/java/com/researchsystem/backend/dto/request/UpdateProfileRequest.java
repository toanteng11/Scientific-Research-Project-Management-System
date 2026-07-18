package com.researchsystem.backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @Size(max = 150, message = "fullName must be at most 150 characters")
    private String fullName;

    @Size(max = 50, message = "academicTitle must be at most 50 characters")
    private String academicTitle;
}
