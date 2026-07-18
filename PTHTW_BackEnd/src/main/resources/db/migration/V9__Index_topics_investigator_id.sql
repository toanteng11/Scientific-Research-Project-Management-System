-- Supports FK lookups and JPA queries filtering or joining on topics.investigator_id
-- (mitigates full-table scans on investigator-scoped topic access paths).

CREATE INDEX idx_topic_investigator ON topics (investigator_id);
