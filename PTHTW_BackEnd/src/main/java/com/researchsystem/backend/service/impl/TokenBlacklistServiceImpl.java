package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.entity.RevokedJwt;
import com.researchsystem.backend.repository.RevokedJwtRepository;
import com.researchsystem.backend.security.JwtTokenProvider;
import com.researchsystem.backend.service.TokenBlacklistService;
import com.researchsystem.backend.util.TokenHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class TokenBlacklistServiceImpl implements TokenBlacklistService {

    private final RevokedJwtRepository revokedJwtRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public void revokeAccessToken(String rawJwt) {
        String hash = TokenHasher.sha256Hex(rawJwt);
        if (revokedJwtRepository.existsByTokenHash(hash)) {
            return;
        }
        Instant exp = jwtTokenProvider.getExpirationInstant(rawJwt);
        revokedJwtRepository.save(RevokedJwt.builder()
                .tokenHash(hash)
                .expiresAt(exp)
                .revokedAt(Instant.now())
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isRevoked(String rawJwt) {
        return revokedJwtRepository.existsByTokenHash(TokenHasher.sha256Hex(rawJwt));
    }
}
