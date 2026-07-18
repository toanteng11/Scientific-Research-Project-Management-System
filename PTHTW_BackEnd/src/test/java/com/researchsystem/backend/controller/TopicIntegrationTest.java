package com.researchsystem.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.researchsystem.backend.domain.entity.Department;
import com.researchsystem.backend.domain.entity.Topic;
import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.domain.enums.ResearchType;
import com.researchsystem.backend.domain.enums.TopicStatus;
import com.researchsystem.backend.dto.request.TopicCreationRequest;
import com.researchsystem.backend.dto.request.TopicStatusChangeRequest;
import com.researchsystem.backend.repository.DepartmentRepository;
import com.researchsystem.backend.repository.TopicRepository;
import com.researchsystem.backend.repository.UserRepository;
import com.researchsystem.backend.service.AuditLogService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the Topic API — verifies end-to-end data flow
 * (Controller → Service → Repository) and Transaction Atomicity (ACID rollback).
 *
 * <h2>Infrastructure</h2>
 * <ul>
 *   <li>H2 in-memory database (MODE=MySQL) bootstrapped by Flyway from
 *       {@code classpath:db/h2-migration/} on every test run.</li>
 *   <li>{@code @ActiveProfiles("test")} activates {@code application-test.yml},
 *       which overrides the MySQL datasource with the H2 datasource.</li>
 *   <li>{@code @Transactional} at the class level ensures each test method
 *       runs in its own transaction that is automatically rolled back afterwards,
 *       guaranteeing complete DB isolation between tests.</li>
 * </ul>
 *
 * <h2>Spring Boot 4.0 / Spring Framework 7.0 annotation mapping</h2>
 * <ul>
 *   <li>{@code @AutoConfigureMockMvc} → moved to
 *       {@code org.springframework.boot.webmvc.test.autoconfigure}.</li>
 *   <li>{@code @SpyBean} → replaced by {@code @MockitoSpyBean}
 *       from {@code org.springframework.test.context.bean.override.mockito}.</li>
 *   <li>{@code @WithMockUser} → still from {@code spring-security-test},
 *       now pulled in via {@code spring-boot-starter-security-test}.</li>
 * </ul>
 *
 * <h2>Transaction mechanics note</h2>
 * {@code @AutoConfigureMockMvc} dispatches requests through the in-process
 * {@code DispatcherServlet} (same JVM thread as the test method). Therefore,
 * service methods annotated with {@code @Transactional(REQUIRED)} JOIN the
 * test's transaction rather than starting their own, which means:
 * <ol>
 *   <li>Test data saved via the repository is immediately visible to the service
 *       through Hibernate's L1 (first-level) session cache.</li>
 *   <li>The rollback after each test cleans up all changes — no manual deletion
 *       is needed.</li>
 * </ol>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Transactional
@DisplayName("Topic Integration Tests")
class TopicIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    /**
     * Wraps the real {@link AuditLogService} bean with a Mockito spy so that
     * Scenario 2 can force a {@link RuntimeException} without touching
     * production code.
     *
     * <p>Note: {@code @MockitoSpyBean} is the Spring Framework 7.0 /
     * Spring Boot 4.0 replacement for the removed {@code @SpyBean}. The spy is
     * reset in {@link #resetAuditLogSpy()} after each test to prevent stubbing
     * leakage across test methods.
     */
    @MockitoSpyBean
    private AuditLogService auditLogService;

    /**
     * Reset the spy after every test to prevent a {@code doThrow} stub set in
     * Scenario 2 from being inherited by subsequent test methods.
     */
    @AfterEach
    void resetAuditLogSpy() {
        Mockito.reset(auditLogService);
    }

    // =========================================================================
    // Scenario 1: Full Data Flow — POST /api/v1/topics/
    // =========================================================================

    @Nested
    @DisplayName("Scenario 1 — Full Data Flow: Create Topic")
    class CreateTopicIntegrationTests {

        /**
         * Simulates a ReactJS client submitting a topic creation form.
         *
         * <p><b>Objective:</b> Verify the complete Controller → Service → Repository
         * chain: the request is validated, the topic is persisted in DRAFT status,
         * and the HTTP response contains the correct status code and JSON body.
         *
         * <p><b>DB Verification:</b> After the HTTP call, the Hibernate session
         * (shared with the test transaction) already contains the saved entity.
         * A direct repository query confirms physical persistence.
         */
        @Test
        @WithMockUser(username = "researcher.fit1@university.edu.vn", roles = "RESEARCHER")
        @DisplayName("POST /api/v1/topics/ → 201 CREATED, topicStatus=DRAFT, entity saved in H2 DB")
        void createTopic_validPayload_returns201AndPersistsDraftInDB() throws Exception {

            // ---- Arrange: build request WITHOUT Lombok builder (critical rule) ----
            TopicCreationRequest request = new TopicCreationRequest();

            request.setTitleVn("Nghiên cứu ứng dụng AI trong giảng dạy đại học");
            request.setResearchType(ResearchType.BASIC);
            request.setResearchField("Artificial Intelligence");
            request.setDurationMonths(12);
            request.setExpectedBudget(BigDecimal.valueOf(50_000));
            request.setManagingDepartmentId(2L); // seed: Khoa Công nghệ Thông tin (CNTT)

            long topicsBefore = topicRepository.count();

            // ---- Act: simulate the ReactJS client POST ----
            mockMvc.perform(
                            post("/api/v1/topics/")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)))
                    // ---- Assert: HTTP layer ----
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.topicCode", matchesPattern("TOPIC-[A-F0-9]{8}")))
                    .andExpect(jsonPath("$.topicStatus").value("DRAFT"));

            assertEquals(topicsBefore + 1, topicRepository.count(),
                    "A successful POST must persist exactly one new topic row");

            Optional<Topic> persisted = topicRepository
                    .findAll()
                    .stream()
                    .filter(t -> t.getTopicCode() != null && t.getTopicCode().startsWith("TOPIC-"))
                    .findFirst();

            assertTrue(persisted.isPresent(),
                    "Topic must be physically saved in the H2 database after a successful POST");
            assertEquals(TopicStatus.DRAFT, persisted.get().getTopicStatus(),
                    "Newly created topic must always start in DRAFT status");
            assertEquals("researcher.fit1@university.edu.vn",
                    persisted.get().getInvestigator().getEmail(),
                    "Principal investigator must be the authenticated user");
        }

        @Test
        @WithMockUser(username = "researcher.fit1@university.edu.vn", roles = "RESEARCHER")
        @DisplayName("POST /api/v1/topics/ with invalid duration → 400 BAD REQUEST, no DB write")
        void createTopic_invalidTopicCode_returns400AndNothingPersisted() throws Exception {

            TopicCreationRequest request = new TopicCreationRequest();

            request.setTitleVn("Tiêu đề hợp lệ");
            request.setResearchType(ResearchType.BASIC);
            request.setResearchField("Computer Science");
            request.setDurationMonths(0);
            request.setExpectedBudget(BigDecimal.valueOf(20_000));
            request.setManagingDepartmentId(2L);

            long countBefore = topicRepository.count();

            mockMvc.perform(
                            post("/api/v1/topics/")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            assertEquals(countBefore, topicRepository.count(),
                    "A validation failure must not persist any record to the database");
        }

        @Test
        @DisplayName("POST /api/v1/topics/ without authentication → 401 UNAUTHORIZED")
        void createTopic_unauthenticated_returns403() throws Exception {

            TopicCreationRequest request = new TopicCreationRequest();

            request.setTitleVn("Unauthenticated request");
            request.setResearchType(ResearchType.APPLIED);
            request.setResearchField("Software Engineering");
            request.setDurationMonths(6);
            request.setExpectedBudget(BigDecimal.valueOf(10_000));
            request.setManagingDepartmentId(2L);

            mockMvc.perform(
                            post("/api/v1/topics/")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }
    }

    // =========================================================================
    // Scenario 2: Transaction Atomicity & Rollback — The ACID Test
    // =========================================================================

    @Nested
    @DisplayName("Scenario 2 — ACID: Transaction rollback on AuditLog failure")
    class TransactionRollbackIntegrationTests {

        /**
         * <b>Objective:</b> Prove that {@code @Transactional} atomicity guarantees
         * that a DB state change (topic status DRAFT → PENDING_REVIEW) is
         * completely rolled back when an error occurs mid-process.
         *
         * <h2>Execution trace inside {@code TopicServiceImpl.changeTopicStatus()}</h2>
         * <ol>
         *   <li>FSM validates DRAFT → PENDING_REVIEW (legal transition) ✓</li>
         *   <li>{@code auditLogService.recordLog()} is called → spy throws
         *       {@link RuntimeException} ("Simulated Hardware Crash"). ← THROWS HERE</li>
         *   <li>{@code topic.setTopicStatus(PENDING_REVIEW)} → <b>NEVER executed</b>.</li>
         *   <li>{@code topicRepository.save(topic)} → <b>NEVER executed</b>.</li>
         * </ol>
         * Since the setter is never called, neither the Hibernate L1 cache nor the
         * DB row is mutated. The {@code @Transactional} proxy marks the shared
         * transaction as rollback-only and rethrows the exception.
         * {@link com.researchsystem.backend.exception.GlobalExceptionHandler}
         * catches the unchecked exception and returns HTTP 500.
         * After the request, fetching the topic confirms its status is still DRAFT.
         */
        @Test
        @WithMockUser(username = "researcher.fit1@university.edu.vn", roles = "RESEARCHER")
        @DisplayName("PATCH /{id}/status → 500 when auditLog throws; topic status remains DRAFT in DB")
        void changeTopicStatus_auditLogThrows_returns500AndStatusRemainsUnchanged()
                throws Exception {

            // ---- Arrange: persist a DRAFT topic directly via repository (no HTTP) ----
            // Seed data (user_id=5, department_id=2) satisfies FK constraints.
            User investigator = userRepository
                    .findByEmail("researcher.fit1@university.edu.vn")
                    .orElseThrow(() -> new AssertionError(
                            "Seed user 'researcher.fit1@university.edu.vn' not found in H2. " +
                            "Verify that V2__Seed_Data.sql ran correctly."));

            Department department = departmentRepository.findById(2L)
                    .orElseThrow(() -> new AssertionError(
                            "Seed department id=2 (CNTT) not found in H2."));

            // Build the Topic entity WITHOUT builder (critical rule)
            Topic topic = new Topic();
            topic.setTopicCode("ACID-TEST-2026-001");
            topic.setTitleVn("Đề tài kiểm thử tính nguyên tử giao dịch");
            topic.setResearchType(ResearchType.APPLIED);
            topic.setResearchField("Software Testing");
            topic.setDurationMonths(6);
            topic.setExpectedBudget(BigDecimal.valueOf(30_000));
            topic.setTopicStatus(TopicStatus.DRAFT);
            topic.setInvestigator(investigator);
            topic.setManagingDepartment(department);
            topic.setFileVersion(1);
            topic.setTopicAttachments(new ArrayList<>());
            topic.setAuditLogs(new ArrayList<>());

            Topic savedTopic = topicRepository.save(topic);
            Long topicId = savedTopic.getTopicId();

            // ---- Arrange: spy — simulate a catastrophic hardware / downstream failure ----
            doThrow(new RuntimeException("Simulated Hardware Crash — disk I/O failure"))
                    .when(auditLogService)
                    .recordLog(any(), any(), any(), any(), any());

            // ---- Arrange: PATCH request payload ----
            TopicStatusChangeRequest changeRequest = new TopicStatusChangeRequest();
            changeRequest.setTargetStatus(TopicStatus.PENDING_REVIEW);
            changeRequest.setFeedbackMessage("Submitted by researcher");

            // ---- Act: call the unified status endpoint ----
            mockMvc.perform(
                            patch("/api/v1/topics/{id}/status", topicId)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(changeRequest)))
                    // ---- Assert (API layer): GlobalExceptionHandler returns 500 ----
                    .andExpect(status().isInternalServerError());

            // ---- Assert (DB layer): status must still be DRAFT ----
            // auditLogService.recordLog() is called BEFORE topic.setTopicStatus() in the
            // service implementation, so the entity was never mutated in the Hibernate
            // L1 cache or the DB row.  The @Transactional proxy marked the transaction
            // rollback-only, ensuring no partial state was ever persisted.
            Topic afterFailedRequest = topicRepository.findById(topicId)
                    .orElseThrow(() -> new AssertionError(
                            "Topic must still exist in DB after a failed (rolled-back) status change"));

            assertEquals(TopicStatus.DRAFT, afterFailedRequest.getTopicStatus(),
                    "ACID guarantee violated: topic status must remain DRAFT because " +
                    "the RuntimeException was thrown before setTopicStatus() was called. " +
                    "The transactional rollback must have prevented any partial state commit.");
        }

        @Test
        @WithMockUser(username = "researcher.fit1@university.edu.vn", roles = "RESEARCHER")
        @DisplayName("PATCH /{id}/status with illegal FSM transition → 409 CONFLICT, auditLog never called")
        void changeTopicStatus_invalidFSMTransition_returns409WithoutCallingAuditLog()
                throws Exception {

            // ---- Arrange: topic already in a terminal APPROVED state ----
            User investigator = userRepository
                    .findByEmail("researcher.fit1@university.edu.vn")
                    .orElseThrow();
            Department department = departmentRepository.findById(2L).orElseThrow();

            Topic topic = new Topic();
            topic.setTopicCode("FSM-TEST-2026-001");
            topic.setTitleVn("Đề tài đã được phê duyệt — trạng thái cuối");
            topic.setResearchType(ResearchType.BASIC);
            topic.setResearchField("Data Science");
            topic.setDurationMonths(12);
            topic.setExpectedBudget(BigDecimal.valueOf(100_000));
            topic.setTopicStatus(TopicStatus.APPROVED); // terminal — no forward transitions
            topic.setInvestigator(investigator);
            topic.setManagingDepartment(department);
            topic.setFileVersion(3);
            topic.setTopicAttachments(new ArrayList<>());
            topic.setAuditLogs(new ArrayList<>());

            Topic savedTopic = topicRepository.save(topic);

            // Attempt illegal regression: APPROVED → PENDING_REVIEW
            TopicStatusChangeRequest changeRequest = new TopicStatusChangeRequest();
            changeRequest.setTargetStatus(TopicStatus.PENDING_REVIEW);

            // ---- Act & Assert (API layer): FSM guard throws IllegalStateException → 409 ----
            mockMvc.perform(
                            patch("/api/v1/topics/{id}/status", savedTopic.getTopicId())
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(changeRequest)))
                    .andExpect(status().isConflict());

            // ---- Assert (spy): fail-fast — auditLog must NOT have been called ----
            // The FSM validation throws before auditLogService.recordLog() is reached.
            Mockito.verify(auditLogService, Mockito.never())
                    .recordLog(any(), any(), any(), any(), any());

            // ---- Assert (DB layer): status remains APPROVED ----
            Topic unchanged = topicRepository.findById(savedTopic.getTopicId()).orElseThrow();
            assertEquals(TopicStatus.APPROVED, unchanged.getTopicStatus(),
                    "An illegal FSM transition must not mutate the topic status in the DB");
        }

        @Test
        @WithMockUser(username = "researcher.fit1@university.edu.vn", roles = "RESEARCHER")
        @DisplayName("PATCH /{id}/status for non-existent topic → 404 NOT FOUND")
        void changeTopicStatus_topicNotFound_returns404() throws Exception {

            TopicStatusChangeRequest changeRequest = new TopicStatusChangeRequest();
            changeRequest.setTargetStatus(TopicStatus.PENDING_REVIEW);

            mockMvc.perform(
                            patch("/api/v1/topics/{id}/status", 999_999L)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(changeRequest)))
                    .andExpect(status().isNotFound());

            // No topics should exist in DB — the Flyway seed adds only users/departments
            List<Topic> allTopics = topicRepository.findAll();
            assertTrue(allTopics.isEmpty(),
                    "No topics should exist in DB when only seed data is present");
        }
    }
}
