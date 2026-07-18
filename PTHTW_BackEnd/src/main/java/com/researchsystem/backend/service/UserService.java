package com.researchsystem.backend.service;

import com.researchsystem.backend.dto.request.CreateCouncilMemberAccountRequest;
import com.researchsystem.backend.dto.request.CreateDeptHeadRequest;
import com.researchsystem.backend.dto.request.CreateManagerRequest;
import com.researchsystem.backend.dto.request.CreateResearcherRequest;
import com.researchsystem.backend.dto.request.UpdateUserStatusRequest;
import com.researchsystem.backend.dto.response.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {

    /**
     * Creates a COUNCIL account (expert). Callable by ADMIN or MANAGER.
     * Auto-generates a temporary password and sends it via email.
     */
    UserResponse createCouncilExpert(CreateCouncilMemberAccountRequest request);

    UserResponse createManager(CreateManagerRequest request);

    UserResponse createResearcher(CreateResearcherRequest request);

    UserResponse createDeptHead(CreateDeptHeadRequest request);

    Page<UserResponse> getAllUsers(Pageable pageable);

    UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request, String actorEmail);

    // BỔ SUNG: Khế ước lấy danh sách giảng viên đủ điều kiện làm thành viên đề tài
    List<UserResponse> getEligibleTopicMembers();
}