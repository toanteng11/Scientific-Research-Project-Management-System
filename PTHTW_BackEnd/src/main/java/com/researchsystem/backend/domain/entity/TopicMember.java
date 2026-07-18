package com.researchsystem.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "topic_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopicMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "topic_member_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    // Thay thế User object bằng String memberName
    @Column(name = "member_name", nullable = false, length = 255)
    private String memberName;
}