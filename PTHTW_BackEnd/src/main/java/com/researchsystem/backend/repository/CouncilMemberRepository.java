package com.researchsystem.backend.repository;

import com.researchsystem.backend.domain.entity.CouncilMember;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouncilMemberRepository extends JpaRepository<CouncilMember, Long> {

    @EntityGraph(attributePaths = {"user", "council"})
    @Override
    Optional<CouncilMember> findById(Long id);

    @EntityGraph(attributePaths = {"user"})
    List<CouncilMember> findByCouncilCouncilId(Long councilId);

    List<CouncilMember> findByUserEmail(String email);

    Optional<CouncilMember> findByCouncilCouncilIdAndUserEmail(Long councilId, String email);

    Optional<CouncilMember> findByCouncilCouncilIdAndUserUserId(Long councilId, Long userId);
}
