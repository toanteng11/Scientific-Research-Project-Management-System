package com.researchsystem.backend.repository;

import com.researchsystem.backend.domain.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    void deleteAllByUser_UserId(Long userId);

    void deleteByExpiresAtBefore(Instant cutoff);
}
