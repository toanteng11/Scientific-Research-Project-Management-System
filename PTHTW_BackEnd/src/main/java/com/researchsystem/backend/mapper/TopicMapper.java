package com.researchsystem.backend.mapper;

import com.researchsystem.backend.domain.entity.Topic;
import com.researchsystem.backend.domain.entity.TopicAttachment;
import com.researchsystem.backend.domain.entity.TopicMember;
import com.researchsystem.backend.dto.request.TopicCreationRequest;
import com.researchsystem.backend.dto.response.AttachmentResponse;
import com.researchsystem.backend.dto.response.TopicDetailResponse;
import com.researchsystem.backend.dto.response.TopicListResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {AuditLogMapper.class})
public interface TopicMapper {

    @Mapping(target = "topicId", ignore = true)
    @Mapping(target = "members", ignore = true)
    Topic toEntity(TopicCreationRequest request);

    @Mapping(source = "topicId", target = "topicId")
    @Mapping(source = "investigator.fullName", target = "investigatorFullName")
    @Mapping(source = "managingDepartment.departmentName", target = "managingDepartmentName")
    TopicListResponse toListResponse(Topic entity);

    @Mapping(source = "topicId", target = "topicId")
    @Mapping(source = "investigator.fullName", target = "investigatorFullName")
    @Mapping(source = "investigator.email", target = "investigatorEmail")
    @Mapping(source = "managingDepartment.departmentName", target = "managingDepartmentName")
    @Mapping(source = "sessionActive", target = "isSessionActive")
    // MapStruct sẽ tự động nhận diện mảng members do trùng tên
    // MapStruct sẽ tự động dùng hàm toAttachmentResponse bên dưới để map mảng topicAttachments -> attachments
    @Mapping(source = "topicAttachments", target = "attachments")
    TopicDetailResponse toDetailResponse(Topic entity);

    // KẾT CẤU MỚI: Chỉ cần định nghĩa khuôn mẫu cho phần tử con, 
    // MapStruct sẽ tự động lo phần List và Builder để tránh lỗi AST Null.
    TopicDetailResponse.TopicMemberInfo toTopicMemberInfo(TopicMember member);

    AttachmentResponse toAttachmentResponse(TopicAttachment attachment);
}