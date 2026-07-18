package com.researchsystem.backend.service;

public interface TokenBlacklistService {

    void revokeAccessToken(String rawJwt);

    boolean isRevoked(String rawJwt);
}
