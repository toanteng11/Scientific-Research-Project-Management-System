package com.researchsystem.backend.dto.response;

import com.researchsystem.backend.domain.enums.CouncilRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouncilDetailResponse {

    private Long councilId;
    private String councilName;
    private LocalDate meetingDate;
    private LocalTime meetingTime;
    private String meetingLocation;
    private List<MemberInfo> members;
    private List<TopicListResponse> topics;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberInfo {
        private Long councilMemberId;
        private Long userId;
        private String fullName;
        private String email;
        private CouncilRole councilRole;
    }
}
