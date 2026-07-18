package com.researchsystem.backend.dto.response;

import com.researchsystem.backend.domain.enums.SystemRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long userId;
    private String email;
    private String fullName;
    private String academicTitle;
    private SystemRole systemRole;
    private boolean firstLogin;
    private boolean active;
    private String departmentName;
}
