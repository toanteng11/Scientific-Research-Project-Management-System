package com.researchsystem.backend.service;

import com.researchsystem.backend.dto.response.DepartmentResponse;
import com.researchsystem.backend.dto.response.TopicListResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DepartmentService {

    /**
     * Returns departments as a Spring Data page (bounded queries; no full-table scan in a single response).
     */
    Page<DepartmentResponse> getAllDepartments(Pageable pageable);

    /**
     * Returns all topics belonging to the department managed by the current DEPT_HEAD user.
     *
     * @param deptHeadEmail email of the authenticated DEPT_HEAD
     * @param pageable      pagination parameters
     */
    Page<TopicListResponse> getDeptTopics(String deptHeadEmail, Pageable pageable);
}
