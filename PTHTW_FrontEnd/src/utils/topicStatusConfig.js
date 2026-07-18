/**
 * FSM transition matrix for TopicStatus.
 * Each entry maps (status, role) → array of permitted actions.
 * An action = { label, targetStatus, requiresFeedback }.
 */
const FSM_TRANSITIONS = {
  DRAFT: {
    RESEARCHER: [
      { label: 'Nộp đề tài', targetStatus: 'PENDING_REVIEW', requiresFeedback: false },
    ],
  },
  PENDING_REVIEW: {
    DEPT_HEAD: [
      { label: 'Duyệt', targetStatus: 'DEPT_APPROVED', requiresFeedback: false },
      { label: 'Từ chối', targetStatus: 'DEPT_REJECTED', requiresFeedback: true },
    ],
  },
  DEPT_REJECTED: {
    RESEARCHER: [
      { label: 'Chỉnh sửa & Nộp lại', targetStatus: 'PENDING_REVIEW', requiresFeedback: false },
    ],
  },
  DEPT_APPROVED: {},
  PENDING_COUNCIL: {},
  COUNCIL_REVIEWED: {},
  REVISION_REQUIRED: {
    RESEARCHER: [
      { label: 'Nộp lại sau chỉnh sửa', targetStatus: 'PENDING_COUNCIL', requiresFeedback: false },
    ],
  },
  APPROVED: {},
  REJECTED: {},
};

export function getAvailableActions(topicStatus, userRole) {
  return FSM_TRANSITIONS[topicStatus]?.[userRole] ?? [];
}

export function isTerminalStatus(status) {
  return status === 'APPROVED' || status === 'REJECTED';
}
