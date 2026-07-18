-- ==============================================================================
-- MIGRATION V12: CHUYỂN ĐỔI THÀNH VIÊN ĐỀ TÀI SANG DẠNG VĂN BẢN (FREE-TEXT)
-- ==============================================================================

-- 1. Gỡ bỏ TẤT CẢ khóa ngoại để giải phóng sự phụ thuộc của Index
ALTER TABLE topic_members DROP FOREIGN KEY fk_topic_member_user;
ALTER TABLE topic_members DROP FOREIGN KEY fk_topic_member_topic;

-- 2. Gỡ bỏ Unique Index
ALTER TABLE topic_members DROP INDEX idx_unique_topic_user;

-- 3. Xóa cột user_id cũ và thêm cột văn bản mới
ALTER TABLE topic_members DROP COLUMN user_id;
ALTER TABLE topic_members ADD COLUMN member_name VARCHAR(255) NOT NULL;

-- 4. Phục hồi lại khóa ngoại topic_id (MySQL sẽ tự động tạo một Index riêng chuẩn xác cho nó)
ALTER TABLE topic_members ADD CONSTRAINT fk_topic_member_topic 
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id) ON DELETE CASCADE;