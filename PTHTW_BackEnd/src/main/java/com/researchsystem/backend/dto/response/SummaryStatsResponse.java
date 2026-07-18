package com.researchsystem.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SummaryStatsResponse {

    private long topicsDraft;
    private long topicsPendingReview;
    private long topicsDeptApproved;
    private long topicsDeptRejected;
    private long topicsPendingCouncil;
    private long topicsCouncilReviewed;
    private long topicsRevisionRequired;
    private long topicsApproved;
    private long topicsRejected;
    /** Sum of workflow pending states useful for dashboards */
    private long topicsPendingTotal;
    private long totalCouncils;
    private long totalUsers;
    private long activeUsers;
}
