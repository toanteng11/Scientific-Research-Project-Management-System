-- ==============================================================================
-- MIGRATION V10: THÊM CƠ CHẾ CHỐNG BRUTE-FORCE VÀO BẢNG USERS
-- ==============================================================================

ALTER TABLE users 
    ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0 AFTER is_active,
    ADD COLUMN locked_until TIMESTAMP NULL AFTER failed_login_attempts;