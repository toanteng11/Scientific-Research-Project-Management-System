-- ==============================================================================
-- V5: TOPIC-SCOPED EVALUATION / MINUTE ISOLATION
-- Purpose:
--   1) Add direct evaluation -> topic linkage
--   2) Enforce one evaluation per (topic, council_member)
--   3) Convert minute uniqueness from council-level to topic-level
--   4) Rewrite denormalization triggers to aggregate by topic_id
-- ==============================================================================

-- ---------------------------------------------------------------------------
-- 1) EVALUATIONS: add topic_id linkage and isolation constraints
-- ---------------------------------------------------------------------------
ALTER TABLE evaluations
    ADD COLUMN topic_id BIGINT NULL AFTER council_member_id;

-- Best-effort deterministic backfill:
-- only backfill where a council is currently linked to exactly one topic.
UPDATE evaluations e
JOIN council_members cm ON cm.council_member_id = e.council_member_id
JOIN topics t ON t.assigned_council_id = cm.council_id
SET e.topic_id = t.topic_id
WHERE e.topic_id IS NULL
  AND (
    SELECT COUNT(*)
    FROM topics t2
    WHERE t2.assigned_council_id = cm.council_id
  ) = 1;

ALTER TABLE evaluations
    MODIFY COLUMN topic_id BIGINT NOT NULL,
    ADD CONSTRAINT fk_evaluation_topic FOREIGN KEY (topic_id)
        REFERENCES topics(topic_id) ON DELETE CASCADE,
    ADD UNIQUE KEY idx_unique_eval_topic_member (topic_id, council_member_id),
    ADD INDEX idx_eval_topic_status (topic_id, submission_status);

-- ---------------------------------------------------------------------------
-- 2) MINUTES: move uniqueness to topic level
-- ---------------------------------------------------------------------------
ALTER TABLE minutes
    DROP FOREIGN KEY fk_minute_council;

ALTER TABLE minutes
    ADD COLUMN topic_id BIGINT NULL AFTER council_id;

ALTER TABLE minutes
    DROP INDEX idx_unique_minute_council;

UPDATE minutes m
JOIN topics t ON t.assigned_council_id = m.council_id
SET m.topic_id = t.topic_id
WHERE m.topic_id IS NULL
  AND (
    SELECT COUNT(*)
    FROM topics t2
    WHERE t2.assigned_council_id = m.council_id
  ) = 1;

ALTER TABLE minutes
    MODIFY COLUMN topic_id BIGINT NOT NULL,
    ADD CONSTRAINT fk_minute_topic FOREIGN KEY (topic_id)
        REFERENCES topics(topic_id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_minute_council FOREIGN KEY (council_id)
        REFERENCES councils(council_id) ON DELETE CASCADE,
    ADD UNIQUE KEY idx_unique_minute_topic (topic_id),
    ADD INDEX idx_minute_council (council_id);

-- ---------------------------------------------------------------------------
-- 3) TRIGGERS: topic-scoped average propagation
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_evaluations_after_insert;
DROP TRIGGER IF EXISTS trg_evaluations_after_update;
DROP TRIGGER IF EXISTS trg_evaluations_after_delete;

DELIMITER //

CREATE TRIGGER trg_evaluations_after_insert
AFTER INSERT ON evaluations
FOR EACH ROW
BEGIN
    DECLARE v_council_id BIGINT;

    SELECT assigned_council_id INTO v_council_id
    FROM topics
    WHERE topic_id = NEW.topic_id;

    INSERT INTO minutes (council_id, topic_id, average_score, synthesized_comments, final_decision)
    VALUES (
        v_council_id,
        NEW.topic_id,
        (
            SELECT AVG(total_score)
            FROM evaluations
            WHERE topic_id = NEW.topic_id
              AND submission_status = 'SUBMITTED'
        ),
        'System auto-initialized',
        'PENDING'
    )
    ON DUPLICATE KEY UPDATE
    average_score = (
        SELECT AVG(total_score)
        FROM evaluations
        WHERE topic_id = NEW.topic_id
          AND submission_status = 'SUBMITTED'
    );
END //

CREATE TRIGGER trg_evaluations_after_update
AFTER UPDATE ON evaluations
FOR EACH ROW
BEGIN
    UPDATE minutes
    SET average_score = IFNULL((
        SELECT AVG(total_score)
        FROM evaluations
        WHERE topic_id = NEW.topic_id
          AND submission_status = 'SUBMITTED'
    ), 0.00)
    WHERE topic_id = NEW.topic_id;
END //

CREATE TRIGGER trg_evaluations_after_delete
AFTER DELETE ON evaluations
FOR EACH ROW
BEGIN
    UPDATE minutes
    SET average_score = IFNULL((
        SELECT AVG(total_score)
        FROM evaluations
        WHERE topic_id = OLD.topic_id
          AND submission_status = 'SUBMITTED'
    ), 0.00)
    WHERE topic_id = OLD.topic_id;
END //

DELIMITER ;
