package com.researchsystem.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.core.io.Resource;

/**
 * Internal payload for streaming a topic attachment with HTTP metadata.
 */
@Getter
@AllArgsConstructor
public class AttachmentDownloadPayload {

    private final Resource resource;
    private final String contentType;
    private final String filename;
}
