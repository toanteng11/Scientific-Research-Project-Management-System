-- ---------------------------------------------------------------------------
-- V14: Add a dedicated micro-state column to the Meeting Minute entity.
--
-- Context:
--   Prior to this migration, the system overloaded `final_decision = PENDING`
--   to mean "Secretary is still drafting". That conflated the legal verdict
--   with the document's collaborative lifecycle. We introduce a dedicated
--   `minute_status` column driven by the MinuteStatus enum:
--       DRAFT, RETURNED_TO_SECRETARY, PUBLISHED
--
-- Backfill strategy:
--   * Rows whose final_decision is PENDING are still in drafting → DRAFT.
--   * Rows with a concrete verdict (APPROVED / REVISION_REQUIRED / REJECTED)
--     represent already-published minutes → PUBLISHED.
-- ---------------------------------------------------------------------------

ALTER TABLE minutes
    ADD COLUMN minute_status VARCHAR(50) NOT NULL DEFAULT 'DRAFT';

UPDATE minutes
   SET minute_status = 'PUBLISHED'
 WHERE final_decision IS NOT NULL
   AND final_decision <> 'PENDING';
