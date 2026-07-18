package com.researchsystem.backend.domain.enums;

public enum FinalDecision {
    /** Hội đồng chưa ra quyết định */
    PENDING,
    /** Đề tài được phê duyệt */
    APPROVED,
    /** Đề tài bị từ chối */
    REJECTED,
    /** Yêu cầu chỉnh sửa, bổ sung trước khi phê duyệt */
    REVISION_REQUIRED
}
