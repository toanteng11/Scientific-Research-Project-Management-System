package com.researchsystem.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouncilListResponse {

    private Long councilId;
    private String councilName;
    private LocalDate meetingDate;
    private String meetingLocation;
    private int memberCount;
    private int topicCount;
}
