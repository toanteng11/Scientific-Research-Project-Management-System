package com.researchsystem.backend.service;

/**
 * Abstraction for asynchronous email dispatching.
 * All implementations MUST be non-blocking relative to the caller's transaction.
 */
public interface EmailService {

    /**
     * Sends a plain-text email asynchronously.
     *
     * @param to      recipient email address
     * @param subject email subject line
     * @param body    plain-text email body
     */
    void sendPlainText(String to, String subject, String body);
}
