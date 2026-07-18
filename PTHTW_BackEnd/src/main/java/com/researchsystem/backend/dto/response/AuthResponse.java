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
public class AuthResponse {

    private String token;
    /**
     * Opaque refresh token (only returned at issuance). Hashed at rest in refresh_tokens.
     */
    private String refreshToken;
    private String tokenType;
    private String email;
    private String fullName;
    private SystemRole role;
    private boolean firstLogin;
}
