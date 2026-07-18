package com.researchsystem.backend.repository;

import com.researchsystem.backend.domain.entity.Council;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

/**
 * FIX: Split the heavy @EntityGraph that was fetching councilMembers + topics
 * simultaneously (causing MultipleBagFetchException when both were List<>).
 *
 * After converting to Set<> on the entity, @EntityGraph can now safely fetch
 * multiple collections. However, the paginated findAll still uses a lighter
 * graph to avoid the HHH90003004 in-memory-pagination warning.
 *
 * Strategy:
 *  - findAllCouncils (paginated list): Lightweight JPQL query, no collection fetch.
 *    Counts are computed via subqueries to avoid Cartesian product + in-memory paging.
 *  - findById (detail view): Full @EntityGraph fetch of members + topics is safe
 *    because it returns a single entity (no pagination concern).
 */
@Repository
public interface CouncilRepository extends JpaRepository<Council, Long> {

    /**
     * Paginated list — NO collection fetch to avoid HHH90003004 warning.
     * The service layer uses the returned councils to build CouncilListResponse
     * with memberCount/topicCount computed via SIZE() subselects.
     */
    @Query("SELECT c FROM Council c ORDER BY c.councilId DESC")
    Page<Council> findAllCouncils(Pageable pageable);

    @Query("""
            SELECT c
            FROM Council c
            WHERE c.meetingDate > :currentDate
               OR (c.meetingDate = :currentDate AND c.meetingTime >= :currentTime)
            ORDER BY c.councilId DESC
            """)
    Page<Council> findAvailableCouncils(LocalDate currentDate, LocalTime currentTime, Pageable pageable);

    /**
     * Detail view — fetches council members and their user profiles in one shot.
     * Topics are fetched separately via a dedicated query to avoid Cartesian product.
     */
    @EntityGraph(
            attributePaths = {
                    "councilMembers",
                    "councilMembers.user"
            })
    @Override
    Optional<Council> findById(Long id);
}
