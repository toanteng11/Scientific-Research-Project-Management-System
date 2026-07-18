package com.researchsystem.backend.util;

import org.apache.tika.Tika;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;

public final class AttachmentUploadWhitelist {

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of("pdf", "doc", "docx");

    private static final Set<String> ALLOWED_MIME_TYPES =
            Set.of(
                    "application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            );

    private static final Tika TIKA = new Tika();

    private AttachmentUploadWhitelist() {}

    /**
     * Result of validating an uploaded file: normalized MIME from Tika and the exact bytes to persist.
     */
    public record ValidatedBinaryPayload(String normalizedContentType, byte[] bytes) {}

    /**
     * Validates filename extension, reads the full payload once, and infers MIME type from magic bytes
     * via Apache Tika. Client-supplied {@code MultipartFile#getContentType()} is not trusted and is ignored.
     */
    public static ValidatedBinaryPayload validateMultipartBinary(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must not be empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported file name");
        }

        String baseName = Paths.get(originalFilename).getFileName().toString();
        String extension = extractExtensionLower(baseName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "Unsupported file extension. Allowed: pdf, doc, docx"
            );
        }

        final byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read uploaded file", ex);
        }

        if (bytes.length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must not be empty");
        }

        String detected = TIKA.detect(bytes, baseName);
        String normalized = normalizeMimeType(detected, extension);
        if (normalized == null || !ALLOWED_MIME_TYPES.contains(normalized)) {
            throw new ResponseStatusException(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "File content does not match an allowed document type (detected: "
                            + (detected != null ? detected : "unknown") + ")"
            );
        }

        return new ValidatedBinaryPayload(normalized, bytes);
    }

    private static String normalizeMimeType(String raw, String extensionLower) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String base = raw.toLowerCase(Locale.ROOT).split(";")[0].trim();
        if (ALLOWED_MIME_TYPES.contains(base)) {
            return base;
        }
        // Tika sometimes reports generic OOXML; only accept as Word when extension is docx.
        if ("docx".equals(extensionLower)
                && ("application/x-tika-ooxml".equals(base) || "application/x-tika-ooxml-protected".equals(base))) {
            return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }
        return base;
    }

    private static String extractExtensionLower(String filename) {
        String name = filename == null ? "" : filename;
        int dot = name.lastIndexOf('.');
        if (dot < 0 || dot == name.length() - 1) return "";
        return name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
