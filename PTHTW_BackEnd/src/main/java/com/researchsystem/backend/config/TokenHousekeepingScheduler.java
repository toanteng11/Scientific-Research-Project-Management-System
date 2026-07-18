package com.researchsystem.backend.config;

import com.researchsystem.backend.repository.PasswordResetTokenRepository;
import com.researchsystem.backend.repository.RefreshTokenRepository;
import com.researchsystem.backend.repository.RevokedJwtRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class TokenHousekeepingScheduler {

    private final RevokedJwtRepository revokedJwtRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void purgeExpiredTokens() {
        Instant now = Instant.now();
        revokedJwtRepository.deleteByExpiresAtBefore(now);
        refreshTokenRepository.deleteByExpiresAtBefore(now);
        passwordResetTokenRepository.deleteByExpiresAtBefore(now);
    }
}
