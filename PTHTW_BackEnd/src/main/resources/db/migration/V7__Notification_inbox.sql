-- ==============================================================================
-- V7: NOTIFICATION INBOX (PERSISTENT)
-- Purpose:
--   1) Provide an in-app notification inbox for users
--   2) Enable read/unread tracking and efficient retrieval by recipient
-- ==============================================================================

CREATE TABLE notifications (
    notification_id BIGINT AUTO_INCREMENT,
    recipient_user_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id BIGINT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    read_at TIMESTAMP(6) NULL,
    PRIMARY KEY (notification_id),
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_user_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_notifications_recipient_created (recipient_user_id, created_at),
    INDEX idx_notifications_recipient_read (recipient_user_id, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

