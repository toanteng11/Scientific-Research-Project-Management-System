package com.researchsystem.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignTopicsRequest {

    @NotEmpty(message = "Topic ID list must not be empty")
    private List<Long> topicIds;
}
