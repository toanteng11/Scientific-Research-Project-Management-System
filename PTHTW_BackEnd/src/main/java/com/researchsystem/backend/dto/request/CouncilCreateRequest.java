package com.researchsystem.backend.dto.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouncilCreateRequest {

    @NotBlank(message = "Council name must not be blank")
    @Size(max = 255)
    private String councilName;

    @NotNull(message = "Meeting date must not be null")
    @FutureOrPresent(message = "Meeting date must be today or in the future")
    private LocalDate meetingDate;

    @NotNull(message = "Meeting time must not be null")
    private LocalTime meetingTime;

    @NotBlank(message = "Meeting location must not be blank")
    @Size(max = 255)
    private String meetingLocation;
}
