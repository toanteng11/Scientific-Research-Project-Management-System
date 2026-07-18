package com.researchsystem.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger UI global configuration.
 *
 * springdoc-openapi 3.x is built for Spring Boot 4.x / Spring Framework 7.x and uses
 * Jackson 3.x (tools.jackson.*) natively — no manual ObjectMapper bean is required.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Research Management API",
                version = "v1",
                description = "REST API for the Research Topic Management System — covers topic lifecycle, " +
                              "council evaluation, user management, and audit trail.",
                contact = @Contact(
                        name = "Research System Team",
                        email = "support@researchsystem.com"
                ),
                license = @License(
                        name = "MIT License",
                        url = "https://opensource.org/licenses/MIT"
                )
        ),
        servers = {
                @Server(url = "http://localhost:8080", description = "Local Development"),
                @Server(url = "https://api.researchsystem.com", description = "Production")
        }
)
@SecurityScheme(
        name = "Bearer Authentication",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        scheme = "bearer",
        in = SecuritySchemeIn.HEADER,
        description = "Provide a valid JWT token obtained from POST /api/v1/auth/login. " +
                      "Format: Authorization: Bearer <token>"
)
public class OpenApiConfig {
}
