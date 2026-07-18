package com.researchsystem.backend.dto.response;

import com.researchsystem.backend.domain.enums.ResearchType;
import com.researchsystem.backend.domain.enums.TopicStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicDetailResponse {

    private Long topicId;
    private String topicCode;
    private String titleVn;
    private String titleEn;
    private TopicStatus topicStatus;
    private BigDecimal expectedBudget;
    private String investigatorFullName;
    private String investigatorEmail;
    private String managingDepartmentName;

    private ResearchType researchType;
    private String researchField;
    private String urgencyStatement;
    private String generalObjective;
    private String specificObjectives;
    private String researchApproach;
    private String researchMethods;
    private String researchScope;
    private String expectedProductsType1;
    private String expectedProductsType2;
    private String budgetExplanation;
    private String trainingPlan;
    private String implementationPlan;
    private int durationMonths;
    private int fileVersion;
    private LocalDateTime submissionDate;
    private boolean isSessionActive;

    private List<AuditLogResponse> auditLogs;
    private List<TopicMemberInfo> members;

    // BỔ SUNG: Khôi phục danh sách tệp đính kèm để hiển thị trên UI
    private List<AttachmentResponse> attachments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopicMemberInfo {
        private Long id;
        private String memberName;
    }
}