package com.researchsystem.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

import com.researchsystem.backend.domain.entity.AuditLog;
import com.researchsystem.backend.dto.response.AuditLogResponse;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface AuditLogMapper {

    @Mapping(target = "id", source = "auditLogId")
    // LƯU Ý KỸ THUẬT: Nếu trong entity AuditLog, biến liên kết với User tên là "user" thay vì "actor", 
    // bạn PHẢI đổi "actor.fullName" thành "user.fullName" ở dòng dưới đây.
    @Mapping(target = "actorFullName", source = "actor.fullName") 
    @Mapping(target = "feedbackNote", source = "feedbackMessage")
    AuditLogResponse toResponse(AuditLog auditLog);
}