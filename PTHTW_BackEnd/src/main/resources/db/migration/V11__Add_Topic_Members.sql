-- ==============================================================================
-- MIGRATION V11: THIẾT LẬP THỰC THỂ KẾT HỢP CHO THÀNH VIÊN ĐỀ TÀI
-- ==============================================================================

CREATE TABLE topic_members (
    topic_member_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    topic_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    CONSTRAINT fk_topic_member_topic FOREIGN KEY (topic_id) 
        REFERENCES topics(topic_id) ON DELETE CASCADE,
    CONSTRAINT fk_topic_member_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY idx_unique_topic_user (topic_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;