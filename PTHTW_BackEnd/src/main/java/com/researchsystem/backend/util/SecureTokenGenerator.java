package com.researchsystem.backend.util;

import java.security.SecureRandom;
import java.util.Base64;

public final class SecureTokenGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    private SecureTokenGenerator() {
    }

    /**
     * URL-safe opaque token (256 bits entropy) for refresh and password-reset flows.
     */
    public static String opaqueUrlSafe(int numBytes) {
        byte[] buf = new byte[numBytes];
        RANDOM.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }
}
