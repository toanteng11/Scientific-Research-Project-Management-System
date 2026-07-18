package com.researchsystem.backend.repository;

import com.researchsystem.backend.domain.entity.RevokedJwt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface RevokedJwtRepository extends JpaRepository<RevokedJwt, Long> {

    boolean existsByTokenHash(String tokenHash);

    void deleteByExpiresAtBefore(Instant cutoff);
}
