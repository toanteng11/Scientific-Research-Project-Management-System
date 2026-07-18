package com.researchsystem.backend.dto.request;

import com.researchsystem.backend.domain.enums.ResearchType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicCreationRequest {

    @NotBlank
    @Size(max = 255)
    private String titleVn;

    @Size(max = 255)
    private String titleEn;

    @NotNull
    private ResearchType researchType;

    @NotBlank
    @Size(max = 100)
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

    @NotNull
    @Min(1)
    @Max(60)
    private Integer durationMonths;

    @NotNull
    private BigDecimal expectedBudget;

    @NotNull
    private Long managingDepartmentId;

    // Đổi từ memberIds sang memberNames
    private List<String> memberNames;
}