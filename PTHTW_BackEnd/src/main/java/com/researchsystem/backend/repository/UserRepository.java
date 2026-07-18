package com.researchsystem.backend.repository;

import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.domain.enums.SubmissionStatus;
import com.researchsystem.backend.domain.enums.SystemRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    long countByActiveTrue();

    List<User> findBySystemRoleInAndActiveTrue(Collection<SystemRole> roles);

    // CẬP NHẬT: Tìm kiếm Phụ trách khoa để gửi thông báo khi QLKH trả hồ sơ
    List<User> findByDepartmentDepartmentIdAndSystemRole(Long departmentId, SystemRole role);

    @Query("""
            SELECT cm.user FROM CouncilMember cm
            LEFT JOIN Evaluation e ON cm.id = e.councilMember.id
            WHERE cm.council.id = :councilId
              AND (e.id IS NULL OR e.submissionStatus = :pendingStatus)
            """)
    List<User> findMembersPendingEvaluation(
            @Param("councilId") Long councilId,
            @Param("pendingStatus") SubmissionStatus pendingStatus);
}