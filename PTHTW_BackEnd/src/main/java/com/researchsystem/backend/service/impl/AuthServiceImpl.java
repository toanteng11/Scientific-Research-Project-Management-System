package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.entity.Department;
import com.researchsystem.backend.domain.entity.PasswordResetToken;
import com.researchsystem.backend.domain.entity.RefreshToken;
import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.dto.request.ForgotPasswordRequest;
import com.researchsystem.backend.dto.request.LoginRequest;
import com.researchsystem.backend.dto.request.RefreshTokenRequest;
import com.researchsystem.backend.dto.request.RegisterTestRequest;
import com.researchsystem.backend.dto.request.ResetPasswordRequest;
import com.researchsystem.backend.dto.request.UpdatePasswordRequest;
import com.researchsystem.backend.dto.request.UpdateProfileRequest;
import com.researchsystem.backend.dto.response.AuthResponse;
import com.researchsystem.backend.dto.response.UserResponse;
import com.researchsystem.backend.repository.DepartmentRepository;
import com.researchsystem.backend.repository.NotificationRepository;
import com.researchsystem.backend.repository.PasswordResetTokenRepository;
import com.researchsystem.backend.repository.RefreshTokenRepository;
import com.researchsystem.backend.repository.UserRepository;
import com.researchsystem.backend.security.CustomUserDetails;
import com.researchsystem.backend.security.CustomUserDetailsService;
import com.researchsystem.backend.security.JwtTokenProvider;
import com.researchsystem.backend.service.AuthService;
import com.researchsystem.backend.service.TokenBlacklistService;
import com.researchsystem.backend.util.SecureTokenGenerator;
import com.researchsystem.backend.util.TokenHasher;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenBlacklistService tokenBlacklistService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final CustomUserDetailsService customUserDetailsService;
    private final NotificationRepository notificationRepository;
    private final DepartmentRepository departmentRepository;

    @Value("${app.jwt.refresh-expiration:604800000}")
    private long refreshExpirationMs;

    @Override
    public AuthResponse login(LoginRequest request) {
        // 1. Kiểm tra tài khoản có bị khóa trước khi xác thực không
        User userForCheck = userRepository.findByEmail(request.getEmail()).orElse(null);
        if (userForCheck != null && userForCheck.getLockedUntil() != null) {
            if (userForCheck.getLockedUntil().isAfter(LocalDateTime.now())) {
                throw new org.springframework.security.authentication.LockedException(
                        "Tài khoản đã bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.");
            } else {
                // Đã hết thời gian khóa, reset lại
                userForCheck.setLockedUntil(null);
                userForCheck.setFailedLoginAttempts(0);
                userRepository.save(userForCheck);
            }
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            // 2. Xử lý khi nhập sai mật khẩu
            if (userForCheck != null) {
                int attempts = userForCheck.getFailedLoginAttempts() + 1;
                userForCheck.setFailedLoginAttempts(attempts);
                if (attempts >= 5) {
                    userForCheck.setLockedUntil(LocalDateTime.now().plusMinutes(15));
                }
                userRepository.save(userForCheck);
            }
            throw ex; // Tiếp tục ném ra để GlobalExceptionHandler bắt và trả về 401
        } catch (AuthenticationException ex) {
            throw new BadCredentialsException("Invalid credentials", ex);
        }

        // 3. Đăng nhập thành công -> Reset số lần sai
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();
        if (user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
        }

        String accessToken = jwtTokenProvider.generateToken(authentication);
        String refreshPlain = createRefreshTokenForUser(user);

        return toAuthResponse(user, accessToken, refreshPlain);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        return toUserResponse(user);
    }

    @Override
    @Transactional
    public void updatePassword(String email, UpdatePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFirstLogin(false);
        userRepository.save(user);
        refreshTokenRepository.deleteAllByUser_UserId(user.getUserId());

        // BỔ SUNG LOGIC: Ghi nhận lịch sử thông báo
        com.researchsystem.backend.domain.entity.Notification notification = com.researchsystem.backend.domain.entity.Notification.builder()
                .recipient(user)
                .notificationType("SECURITY_ALERT")
                .title("Thay đổi mật khẩu thành công")
                .body("Mật khẩu tài khoản của bạn đã được thay đổi thành công vào lúc " + LocalDateTime.now() + ". Nếu bạn không thực hiện hành động này, vui lòng liên hệ quản trị viên ngay lập tức.")
                .resourceType("ACCOUNT")
                .resourceId(user.getUserId())
                .build();
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void registerTestUser(RegisterTestRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khoa với ID: " + request.getDepartmentId()));
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .systemRole(request.getSystemRole())
                .department(department)
                .isFirstLogin(false)
                .active(true)
                .build();

        userRepository.save(user);
    }

    @Override
    @Transactional
    public void logout(String email, String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Authorization header must be a Bearer token");
        }
        String jwt = authorizationHeader.substring(7).trim();
        if (!jwtTokenProvider.validateToken(jwt)) {
            throw new BadCredentialsException("Invalid or expired access token");
        }
        String subject = jwtTokenProvider.getEmailFromToken(jwt);
        if (!subject.equalsIgnoreCase(email)) {
            throw new AccessDeniedException("Token subject does not match authenticated user");
        }
        tokenBlacklistService.revokeAccessToken(jwt);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        refreshTokenRepository.deleteAllByUser_UserId(user.getUserId());
    }

    @Override
    @Transactional
    public AuthResponse refreshTokens(RefreshTokenRequest request) {
        String hash = TokenHasher.sha256Hex(request.getRefreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(stored);
            throw new BadCredentialsException("Expired refresh token");
        }
        User user = stored.getUser();
        refreshTokenRepository.delete(stored);

        CustomUserDetails userDetails = (CustomUserDetails) customUserDetailsService.loadUserByUsername(
                user.getEmail());
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        String accessToken = jwtTokenProvider.generateToken(authentication);
        String refreshPlain = createRefreshTokenForUser(user);
        return toAuthResponse(user, accessToken, refreshPlain);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail().trim()).ifPresent(user -> {
            if (!user.isActive()) {
                return;
            }
            passwordResetTokenRepository.deleteAllByUser_UserId(user.getUserId());
            String plain = SecureTokenGenerator.opaqueUrlSafe(32);
            String hash = TokenHasher.sha256Hex(plain);
            passwordResetTokenRepository.save(PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(hash)
                    .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                    .createdAt(Instant.now())
                    .build());
            log.info("Password reset token issued for {} (dev visibility): {}", user.getEmail(), plain);
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String hash = TokenHasher.sha256Hex(request.getToken());
        PasswordResetToken prt = passwordResetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired reset token"));
        if (prt.getExpiresAt().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(prt);
            throw new BadCredentialsException("Expired reset token");
        }
        User user = prt.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFirstLogin(false);
        userRepository.save(user);
        passwordResetTokenRepository.delete(prt);
        refreshTokenRepository.deleteAllByUser_UserId(user.getUserId());
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        boolean hasName = request.getFullName() != null && !request.getFullName().isBlank();
        boolean hasTitle = request.getAcademicTitle() != null;
        if (!hasName && !hasTitle) {
            throw new IllegalArgumentException("At least one of fullName or academicTitle must be provided");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User not found with email: " + email));
        if (hasName) {
            user.setFullName(request.getFullName().trim());
        }
        if (hasTitle) {
            String t = request.getAcademicTitle().trim();
            user.setAcademicTitle(t.isEmpty() ? null : t);
        }
        userRepository.save(user);
        return toUserResponse(user);
    }

    private String createRefreshTokenForUser(User user) {
        String plain = SecureTokenGenerator.opaqueUrlSafe(32);
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .tokenHash(TokenHasher.sha256Hex(plain))
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .createdAt(Instant.now())
                .build());
        return plain;
    }

    private AuthResponse toAuthResponse(User user, String accessToken, String refreshPlain) {
        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshPlain)
                .tokenType("Bearer")
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getSystemRole())
                .firstLogin(user.isFirstLogin())
                .build();
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .academicTitle(user.getAcademicTitle())
                .systemRole(user.getSystemRole())
                .firstLogin(user.isFirstLogin())
                .active(user.isActive())
                .departmentName(user.getDepartment() != null
                        ? user.getDepartment().getDepartmentName() : null)
                .build();
    }
}