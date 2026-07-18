package com.researchsystem.backend.domain.enums;

public enum SystemRole {
    /** Quản trị viên hệ thống — toàn quyền */
    ADMIN,
    /** Nhân viên Phòng Quản lý Khoa học */
    MANAGER,
    /** Phụ trách / Trưởng khoa */
    DEPT_HEAD,
    /** Giảng viên / Chủ nhiệm đề tài */
    RESEARCHER,
    /** Chuyên gia hội đồng phản biện */
    COUNCIL
}
