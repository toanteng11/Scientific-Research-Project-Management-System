package com.researchsystem.backend.dto.request;

import com.researchsystem.backend.domain.enums.TopicStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicStatusChangeRequest {

    @NotNull
    private TopicStatus targetStatus;

    private String feedbackMessage;
}
