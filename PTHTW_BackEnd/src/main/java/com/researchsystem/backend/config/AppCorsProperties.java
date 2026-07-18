package com.researchsystem.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

/**
 * Binds {@code app.cors.*} from the environment. Origins are supplied as a single
 * comma-separated string (e.g. {@code CORS_ALLOWED_ORIGINS}) to support standard
 * twelve-factor deployment without indexed property lists.
 */
@ConfigurationProperties(prefix = "app.cors")
public record AppCorsProperties(String allowedOrigins) {

    /**
     * Parses {@link #allowedOrigins} into discrete origin URLs for the Spring Security CORS bean.
     */
    public List<String> allowedOriginsList() {
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            return List.of();
        }
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
