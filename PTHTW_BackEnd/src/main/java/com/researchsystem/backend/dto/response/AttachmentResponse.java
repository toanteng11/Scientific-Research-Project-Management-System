package com.researchsystem.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachmentResponse {

    private Long attachmentId;
    private String documentType;
    private String fileUri;
    private String fileName;
    private LocalDateTime uploadedAt;
    private Integer fileVersion;
}
