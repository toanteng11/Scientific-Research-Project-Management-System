package com.researchsystem.backend.repository;

import com.researchsystem.backend.domain.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    void deleteAllByUser_UserId(Long userId);

    void deleteByExpiresAtBefore(Instant cutoff);
}
