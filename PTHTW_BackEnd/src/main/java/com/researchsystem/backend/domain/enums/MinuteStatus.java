package com.researchsystem.backend.domain.enums;

/**
 * Micro-state machine for the Council Meeting Minute document.
 *
 * Separate from the Topic macro-FSM ({@link TopicStatus}) and from the
 * legal verdict ({@link FinalDecision}). This enum captures ONLY the
 * document's collaborative lifecycle between Secretary and President.
 *
 * Allowed transitions:
 *
 *   (none)                 --[Secretary drafts]-->  DRAFT
 *   DRAFT                  --[President returns]--> RETURNED_TO_SECRETARY
 *   RETURNED_TO_SECRETARY  --[Secretary redrafts]-> DRAFT
 *   DRAFT                  --[President approves]-> PUBLISHED
 *
 * PUBLISHED is terminal and is the only state that may trigger the
 * Topic macro-FSM transition and downstream notifications.
 */
public enum MinuteStatus {

    /** Secretary has submitted a working draft; awaiting President's review. */
    DRAFT,

    /** President rejected the current draft and sent it back to the Secretary. */
    RETURNED_TO_SECRETARY,

    /** President approved and published the minute. Topic macro-FSM now fires. */
    PUBLISHED
}
