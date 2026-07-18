package com.researchsystem.backend.service;

import com.researchsystem.backend.dto.request.ForgotPasswordRequest;
import com.researchsystem.backend.dto.request.LoginRequest;
import com.researchsystem.backend.dto.request.RefreshTokenRequest;
import com.researchsystem.backend.dto.request.RegisterTestRequest;
import com.researchsystem.backend.dto.request.ResetPasswordRequest;
import com.researchsystem.backend.dto.request.UpdatePasswordRequest;
import com.researchsystem.backend.dto.request.UpdateProfileRequest;
import com.researchsystem.backend.dto.response.AuthResponse;
import com.researchsystem.backend.dto.response.UserResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser(String email);

    void updatePassword(String email, UpdatePasswordRequest request);

    void registerTestUser(RegisterTestRequest request);

    /**
     * Stateless logout: blacklist the presented access JWT and drop all refresh sessions for the user.
     */
    void logout(String email, String authorizationHeader);

    AuthResponse refreshTokens(RefreshTokenRequest request);

    /**
     * Always completes without revealing whether the email exists; issues a reset token when the user is active.
     */
    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    UserResponse updateProfile(String email, UpdateProfileRequest request);
}
