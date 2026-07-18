-- ==============================================================================
-- MIGRATION V8: EXPAND TOPICS TABLE WITH RICH TEXT CONTENT COLUMNS
-- PURPOSE: Persist the full research proposal payload from the 5-step wizard form
-- ENGINE: INNODB | LONGTEXT columns store off-page, no row-size impact on indexes
-- ==============================================================================

ALTER TABLE topics
    ADD COLUMN urgency_statement LONGTEXT NULL AFTER research_field,
    ADD COLUMN general_objective LONGTEXT NULL AFTER urgency_statement,
    ADD COLUMN specific_objectives LONGTEXT NULL AFTER general_objective,
    ADD COLUMN research_approach LONGTEXT NULL AFTER specific_objectives,
    ADD COLUMN research_methods LONGTEXT NULL AFTER research_approach,
    ADD COLUMN research_scope LONGTEXT NULL AFTER research_methods,
    ADD COLUMN expected_products_type1 LONGTEXT NULL AFTER research_scope,
    ADD COLUMN expected_products_type2 LONGTEXT NULL AFTER expected_products_type1,
    ADD COLUMN budget_explanation LONGTEXT NULL AFTER expected_products_type2,
    ADD COLUMN training_plan LONGTEXT NULL AFTER budget_explanation,
    ADD COLUMN implementation_plan LONGTEXT NULL AFTER training_plan;
