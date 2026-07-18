-- ==============================================================================
-- DỰ ÁN: HỆ THỐNG QUẢN LÝ ĐỀ TÀI NGHIÊN CỨU KHOA HỌC
-- MÔ TẢ: KHỞI TẠO LƯỢC ĐỒ CƠ SỞ DỮ LIỆU MỨC VẬT LÝ
-- ENGINE: INNODB | CHARSET: UTF8MB4 | COLLATE: UTF8MB4_UNICODE_CI
-- ==============================================================================

-- 1. TẠO BẢNG DEPARTMENTS (Không có Khóa ngoại)
CREATE TABLE departments (
    department_id BIGINT AUTO_INCREMENT,
    department_code VARCHAR(50) NOT NULL,
    department_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NULL,
    contact_phone VARCHAR(20) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (department_id),
    UNIQUE KEY idx_unique_dept_code (department_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TẠO BẢNG COUNCILS (Không có Khóa ngoại)
CREATE TABLE councils (
    council_id BIGINT AUTO_INCREMENT,
    council_name VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_time TIME NOT NULL,
    meeting_location VARCHAR(255) NOT NULL,
    PRIMARY KEY (council_id),
    INDEX idx_council_meeting_date (meeting_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TẠO BẢNG USERS (Phụ thuộc: departments)
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    academic_title VARCHAR(50) NULL,
    system_role VARCHAR(50) NOT NULL,
    is_first_login TINYINT(1) NOT NULL DEFAULT 1,
    department_id BIGINT NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY idx_unique_user_email (email),
    INDEX idx_user_system_role (system_role),
    CONSTRAINT fk_user_department FOREIGN KEY (department_id) 
        REFERENCES departments(department_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TẠO BẢNG TOPICS (Phụ thuộc: users, departments, councils)
CREATE TABLE topics (
    topic_id BIGINT AUTO_INCREMENT,
    topic_code VARCHAR(50) NOT NULL,
    title_vn VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NULL,
    research_type VARCHAR(50) NOT NULL,
    research_field VARCHAR(100) NOT NULL,
    duration_months INT NOT NULL,
    expected_budget DECIMAL(15,2) NOT NULL,
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    topic_status VARCHAR(50) NOT NULL,
    file_version INT NOT NULL DEFAULT 1,
    investigator_id BIGINT NOT NULL,
    managing_department_id BIGINT NOT NULL,
    assigned_council_id BIGINT NULL,
    PRIMARY KEY (topic_id),
    UNIQUE KEY idx_unique_topic_code (topic_code),
    INDEX idx_topic_status (topic_status),
    INDEX idx_topic_dept_status (managing_department_id, topic_status),
    CONSTRAINT fk_topic_investigator FOREIGN KEY (investigator_id) 
        REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_topic_department FOREIGN KEY (managing_department_id) 
        REFERENCES departments(department_id) ON DELETE RESTRICT,
    CONSTRAINT fk_topic_council FOREIGN KEY (assigned_council_id) 
        REFERENCES councils(council_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TẠO BẢNG TOPIC_ATTACHMENTS (Phụ thuộc: topics)
CREATE TABLE topic_attachments (
    attachment_id BIGINT AUTO_INCREMENT,
    document_type VARCHAR(50) NOT NULL,
    file_uri VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    topic_id BIGINT NOT NULL,
    file_version INT NOT NULL,
    PRIMARY KEY (attachment_id),
    CONSTRAINT fk_attachment_topic FOREIGN KEY (topic_id) 
        REFERENCES topics(topic_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TẠO BẢNG COUNCIL_MEMBERS (Phụ thuộc: councils, users)
CREATE TABLE council_members (
    council_member_id BIGINT AUTO_INCREMENT,
    council_role VARCHAR(50) NOT NULL,
    council_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (council_member_id),
    UNIQUE KEY idx_unique_council_user (council_id, user_id),
    CONSTRAINT fk_member_council FOREIGN KEY (council_id) 
        REFERENCES councils(council_id) ON DELETE CASCADE,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TẠO BẢNG MINUTES (Phụ thuộc: councils)
CREATE TABLE minutes (
    minute_id BIGINT AUTO_INCREMENT,
    average_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    synthesized_comments TEXT NOT NULL,
    final_decision VARCHAR(50) NOT NULL,
    legal_confirmation TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    council_id BIGINT NOT NULL,
    PRIMARY KEY (minute_id),
    UNIQUE KEY idx_unique_minute_council (council_id),
    CONSTRAINT fk_minute_council FOREIGN KEY (council_id) 
        REFERENCES councils(council_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. TẠO BẢNG EVALUATIONS (Phụ thuộc: council_members)
CREATE TABLE evaluations (
    evaluation_id BIGINT AUTO_INCREMENT,
    score_urgency DECIMAL(5,2) NOT NULL,
    score_content DECIMAL(5,2) NOT NULL,
    score_objectives DECIMAL(5,2) NOT NULL,
    score_methodology DECIMAL(5,2) NOT NULL,
    score_feasibility DECIMAL(5,2) NOT NULL,
    score_capacity DECIMAL(5,2) NOT NULL,
    score_products DECIMAL(5,2) NOT NULL,
    total_score DECIMAL(5,2) NOT NULL,
    general_comment TEXT NULL,
    recommended_decision VARCHAR(50) NULL,
    submission_status VARCHAR(50) NOT NULL,
    council_member_id BIGINT NOT NULL,
    PRIMARY KEY (evaluation_id),
    INDEX idx_eval_submission_status (submission_status),
    CONSTRAINT fk_evaluation_member FOREIGN KEY (council_member_id) 
        REFERENCES council_members(council_member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. TẠO BẢNG AUDIT_LOGS (Phụ thuộc: topics, users)
CREATE TABLE audit_logs (
    audit_log_id BIGINT AUTO_INCREMENT,
    previous_status VARCHAR(50) NULL,
    new_status VARCHAR(50) NOT NULL,
    action_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    feedback_message TEXT NULL,
    topic_id BIGINT NOT NULL,
    actor_id BIGINT NOT NULL,
    PRIMARY KEY (audit_log_id),
    INDEX idx_audit_topic_time (topic_id, action_timestamp),
    CONSTRAINT fk_audit_topic FOREIGN KEY (topic_id) 
        REFERENCES topics(topic_id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) 
        REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 10. THIẾT LẬP CƠ CHẾ TRIGGER GIẢI CHUẨN HÓA (DENORMALIZATION MECHANISM)
-- Cập nhật tự động average_score trong bảng minutes khi evaluations thay đổi
-- ==============================================================================

DELIMITER //

CREATE TRIGGER trg_evaluations_after_insert
AFTER INSERT ON evaluations
FOR EACH ROW
BEGIN
    DECLARE v_council_id BIGINT;
    
    -- Tìm council_id tương ứng với thành viên vừa chấm điểm
    SELECT council_id INTO v_council_id 
    FROM council_members 
    WHERE council_member_id = NEW.council_member_id;
    
    -- Cập nhật điểm trung bình (sử dụng INSERT ON DUPLICATE KEY UPDATE để bao hàm trường hợp biên bản chưa được tạo)
    INSERT INTO minutes (council_id, average_score, synthesized_comments, final_decision) 
    VALUES (
        v_council_id, 
        (SELECT AVG(total_score) FROM evaluations e JOIN council_members cm ON e.council_member_id = cm.council_member_id WHERE cm.council_id = v_council_id),
        'Hệ thống tự động khởi tạo', 
        'PENDING'
    )
    ON DUPLICATE KEY UPDATE 
    average_score = (SELECT AVG(total_score) FROM evaluations e JOIN council_members cm ON e.council_member_id = cm.council_member_id WHERE cm.council_id = v_council_id);
END //

CREATE TRIGGER trg_evaluations_after_update
AFTER UPDATE ON evaluations
FOR EACH ROW
BEGIN
    DECLARE v_council_id BIGINT;
    
    SELECT council_id INTO v_council_id 
    FROM council_members 
    WHERE council_member_id = NEW.council_member_id;
    
    UPDATE minutes 
    SET average_score = (SELECT AVG(total_score) FROM evaluations e JOIN council_members cm ON e.council_member_id = cm.council_member_id WHERE cm.council_id = v_council_id)
    WHERE council_id = v_council_id;
END //

CREATE TRIGGER trg_evaluations_after_delete
AFTER DELETE ON evaluations
FOR EACH ROW
BEGIN
    DECLARE v_council_id BIGINT;
    
    SELECT council_id INTO v_council_id 
    FROM council_members 
    WHERE council_member_id = OLD.council_member_id;
    
    UPDATE minutes 
    SET average_score = IFNULL((SELECT AVG(total_score) FROM evaluations e JOIN council_members cm ON e.council_member_id = cm.council_member_id WHERE cm.council_id = v_council_id), 0.00)
    WHERE council_id = v_council_id;
END //

DELIMITER ;