package com.researchsystem.backend.repository;

import com.researchsystem.backend.domain.entity.Minute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MinuteRepository extends JpaRepository<Minute, Long> {

    Optional<Minute> findByTopicTopicId(Long topicId);
}
