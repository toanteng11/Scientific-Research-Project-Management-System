package com.researchsystem.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCouncilMemberAccountRequest {

    @NotBlank(message = "Email must not be blank")
    @Email(message = "Email must be a valid email address")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Full name must not be blank")
    @Size(max = 150)
    private String fullName;

    @Size(max = 50)
    private String academicTitle;
}