package com.researchsystem.backend.service.impl;

import com.researchsystem.backend.domain.entity.Department;
import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.dto.response.DepartmentResponse;
import com.researchsystem.backend.dto.response.TopicListResponse;
import com.researchsystem.backend.mapper.TopicMapper;
import com.researchsystem.backend.repository.DepartmentRepository;
import com.researchsystem.backend.repository.TopicRepository;
import com.researchsystem.backend.repository.UserRepository;
import com.researchsystem.backend.service.DepartmentService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final TopicMapper topicMapper;

    @Override
    public Page<DepartmentResponse> getAllDepartments(Pageable pageable) {
        return departmentRepository.findAll(pageable).map(this::toDepartmentResponse);
    }

    @Override
    public Page<TopicListResponse> getDeptTopics(String deptHeadEmail, Pageable pageable) {
        User deptHead = userRepository.findByEmail(deptHeadEmail)
                .orElseThrow(() -> new EntityNotFoundException(
                        "User not found with email: " + deptHeadEmail));

        if (deptHead.getDepartment() == null) {
            throw new IllegalStateException("Current user is not assigned to any department");
        }

        Long departmentId = deptHead.getDepartment().getDepartmentId();
        return topicRepository.findByManagingDepartmentDepartmentId(departmentId, pageable)
                .map(topicMapper::toListResponse);
    }

    private DepartmentResponse toDepartmentResponse(Department dept) {
        return DepartmentResponse.builder()
                .departmentId(dept.getDepartmentId())
                .departmentCode(dept.getDepartmentCode())
                .departmentName(dept.getDepartmentName())
                .contactEmail(dept.getContactEmail())
                .contactPhone(dept.getContactPhone())
                .active(dept.isActive())
                .build();
    }
}
