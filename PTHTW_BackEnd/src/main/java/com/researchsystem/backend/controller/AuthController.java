package com.researchsystem.backend.controller;

import com.researchsystem.backend.dto.request.ForgotPasswordRequest;
import com.researchsystem.backend.dto.request.LoginRequest;
import com.researchsystem.backend.dto.request.RefreshTokenRequest;
import com.researchsystem.backend.dto.request.RegisterTestRequest;
import com.researchsystem.backend.dto.request.ResetPasswordRequest;
import com.researchsystem.backend.dto.request.UpdatePasswordRequest;
import com.researchsystem.backend.dto.request.UpdateProfileRequest;
import com.researchsystem.backend.dto.response.AuthResponse;
import com.researchsystem.backend.dto.response.UserResponse;
import com.researchsystem.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, token lifecycle, profile, and password management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(
            summary = "Authenticate user and obtain access + refresh tokens",
            description = "Validates email/password credentials and returns a signed JWT plus an opaque refresh token."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Authentication successful"),
            @ApiResponse(responseCode = "400", description = "Bad Request — validation error on request body"),
            @ApiResponse(responseCode = "401", description = "Unauthorized — invalid credentials")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token and obtain a new access token",
            description = "Accepts a valid opaque refresh token, invalidates it, and returns fresh access and refresh tokens.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tokens refreshed"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshTokens(request));
    }

    @PostMapping("/logout")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Logout and revoke the current access token",
            description = "Adds the presented JWT to the server-side revocation list until its natural expiry and clears refresh sessions.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Logged out"),
            @ApiResponse(responseCode = "400", description = "Missing or malformed Authorization header"),
            @ApiResponse(responseCode = "401", description = "Invalid access token"),
            @ApiResponse(responseCode = "403", description = "Token subject mismatch")
    })
    public ResponseEntity<Void> logout(
            @Parameter(hidden = true) Principal principal,
            HttpServletRequest request) {
        authService.logout(principal.getName(), request.getHeader(HttpHeaders.AUTHORIZATION));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register-test")
    @Operation(
            summary = "[Temporary] Register a test user for bootstrap",
            description = "Creates a user with a BCrypt-encoded password. Intended for local/dev when seed data hashes do not match the encoder."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User created"),
            @ApiResponse(responseCode = "400", description = "Validation error or email already in use")
    })
    public ResponseEntity<Void> registerTest(@Valid @RequestBody RegisterTestRequest request) {
        authService.registerTestUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset token",
            description = "Idempotent: always returns 204. If the account exists and is active, a single-use reset token is issued (logged in dev).")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Request accepted"),
            @ApiResponse(responseCode = "400", description = "Validation error")
    })
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Complete password reset with a token",
            description = "Sets a new password from a reset token and invalidates refresh sessions.")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Password updated"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "401", description = "Invalid or expired reset token")
    })
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Get current authenticated user's profile",
            description = "Returns the full profile of the user identified by the JWT in the Authorization header."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile retrieved successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request"),
            @ApiResponse(responseCode = "403", description = "Forbidden — valid token required")
    })
    public ResponseEntity<UserResponse> getMe(@Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(authService.getCurrentUser(principal.getName()));
    }

    @PatchMapping("/profile")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Update self-service profile fields",
            description = "Updates the caller's display name and/or academic title.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile updated"),
            @ApiResponse(responseCode = "400", description = "Validation error or empty payload"),
            @ApiResponse(responseCode = "403", description = "Forbidden — valid token required")
    })
    public ResponseEntity<UserResponse> patchProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @Parameter(hidden = true) Principal principal) {
        return ResponseEntity.ok(authService.updateProfile(principal.getName(), request));
    }

    @PatchMapping("/password")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(
            summary = "Update password for the authenticated user",
            description = "Verifies the current password before setting the new one. " +
                          "Clears the first-login flag upon success. Invalidates refresh tokens."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Password updated successfully"),
            @ApiResponse(responseCode = "400", description = "Bad Request — current password incorrect or validation failure"),
            @ApiResponse(responseCode = "403", description = "Forbidden — valid token required")
    })
    public ResponseEntity<Void> updatePassword(
            @Valid @RequestBody UpdatePasswordRequest request,
            @Parameter(hidden = true) Principal principal) {
        authService.updatePassword(principal.getName(), request);
        return ResponseEntity.noContent().build();
    }
}
