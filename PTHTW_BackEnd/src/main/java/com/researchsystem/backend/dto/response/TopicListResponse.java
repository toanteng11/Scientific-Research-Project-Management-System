package com.researchsystem.backend.dto.response;

import com.researchsystem.backend.domain.enums.CouncilRole;
import com.researchsystem.backend.domain.enums.TopicStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicListResponse {

    private Long topicId;
    private String topicCode;
    private String titleVn;
    private String titleEn;
    private TopicStatus topicStatus;
    private BigDecimal expectedBudget;
    private String investigatorFullName;
    private String managingDepartmentName;
    
    private String councilName; 
    private CouncilRole councilRole; 
    private Long councilId;
    private Long councilMemberId;

    // [VÁ LỖ HỔNG NGHIỆP VỤ]: Truyền cờ điều phối về cho UI
    private boolean isSessionActive;
}