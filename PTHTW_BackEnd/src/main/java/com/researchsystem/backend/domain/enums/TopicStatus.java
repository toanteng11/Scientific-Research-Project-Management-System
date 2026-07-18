package com.researchsystem.backend.domain.enums;

    import com.fasterxml.jackson.annotation.JsonProperty;

public enum TopicStatus {
    /** Bản nháp — chưa nộp */
    DRAFT,
    /** Đã nộp — chờ Trưởng khoa duyệt */
    @JsonProperty("PENDING_DEPT")
    PENDING_REVIEW,
    /** Trưởng khoa đã duyệt — chờ Phòng QLKH xử lý */
    DEPT_APPROVED,
    /** Trưởng khoa từ chối */
    DEPT_REJECTED,
    /** Đã phân công Hội đồng — chờ phản biện */
    PENDING_COUNCIL,
    /** Hội đồng đã hoàn tất đánh giá */
    COUNCIL_REVIEWED,
    /** Yêu cầu chỉnh sửa bổ sung */
    REVISION_REQUIRED,
    /** Được phê duyệt chính thức */
    APPROVED,
    /** Bị từ chối chính thức */
    REJECTED
}
