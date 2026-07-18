package com.researchsystem.backend.repository;

import com.researchsystem.backend.domain.entity.Topic;
import com.researchsystem.backend.domain.enums.TopicStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long> {

    @EntityGraph(attributePaths = {"investigator", "managingDepartment"})
    Page<Topic> findByTopicStatus(TopicStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"investigator", "managingDepartment"})
    Page<Topic> findByManagingDepartmentDepartmentIdAndTopicStatus(
            Long departmentId, TopicStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"investigator", "managingDepartment"})
    Page<Topic> findByManagingDepartmentDepartmentId(Long departmentId, Pageable pageable);

    @EntityGraph(attributePaths = {"investigator", "managingDepartment"})
    Page<Topic> findByInvestigatorEmail(String email, Pageable pageable);

    @EntityGraph(attributePaths = {"investigator", "managingDepartment"})
    Page<Topic> findByAssignedCouncilCouncilId(Long councilId, Pageable pageable);

    @EntityGraph(attributePaths = {"investigator", "managingDepartment"})
    @Query("""
            SELECT DISTINCT t FROM Topic t
            WHERE t.assignedCouncil.councilId IN (
                SELECT cm.council.councilId FROM CouncilMember cm
                WHERE cm.user.email = :email
            )
            """)
    Page<Topic> findTopicsAssignedToExpert(@Param("email") String email, Pageable pageable);

    boolean existsByTopicCode(String topicCode);

    long countByTopicStatus(TopicStatus topicStatus);

    @EntityGraph(
            attributePaths = {
                    "investigator",
                    "managingDepartment",
                    "assignedCouncil",
                    "topicAttachments",
                    "auditLogs"
            })
    Optional<Topic> findById(Long id);

    @Query("SELECT t.titleVn FROM Topic t WHERE t.titleVn IS NOT NULL")
    List<String> findAllTitleVn();
}
