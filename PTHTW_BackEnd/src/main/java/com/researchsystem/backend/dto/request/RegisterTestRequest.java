package com.researchsystem.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.researchsystem.backend.domain.enums.SystemRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterTestRequest {

    @NotBlank(message = "Email must not be blank")
    @Email(message = "Email must be a valid email address")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Password must not be blank")
    @Size(min = 8, max = 128)
    @Pattern(
        regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$",
        message = "Mật khẩu phải bao gồm ít nhất một chữ hoa, một chữ thường, một chữ số và một ký tự đặc biệt"
    )
    private String password;

    @NotBlank(message = "Full name must not be blank")
    @Size(max = 150)
    private String fullName;

    @NotNull(message = "System role must not be null")
    private SystemRole systemRole;

    @JsonProperty("department_id")
    private Long departmentId;
}