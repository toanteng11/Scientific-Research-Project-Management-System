import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatVND(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: vi });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm', { locale: vi });
}

export function formatRelative(dateStr) {
  if (!dateStr) return '—';
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: vi });
}

const STATUS_LABELS = {
  DRAFT: 'Bản nháp',
  /** Wire value from TopicStatus.PENDING_REVIEW (@JsonProperty "PENDING_DEPT"). */
  PENDING_DEPT: 'Chờ duyệt Khoa',
  DEPT_APPROVED: 'Khoa đã duyệt',
  DEPT_REJECTED: 'Khoa từ chối',
  PENDING_COUNCIL: 'Chờ Hội đồng',
  COUNCIL_REVIEWED: 'Hội đồng đã đánh giá',
  REVISION_REQUIRED: 'Yêu cầu chỉnh sửa',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Không duyệt',
};

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_DEPT: 'bg-yellow-100 text-yellow-800',
  DEPT_APPROVED: 'bg-blue-100 text-blue-700',
  DEPT_REJECTED: 'bg-red-100 text-red-700',
  PENDING_COUNCIL: 'bg-indigo-100 text-indigo-700',
  COUNCIL_REVIEWED: 'bg-purple-100 text-purple-700',
  REVISION_REQUIRED: 'bg-orange-100 text-orange-800',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export function getStatusLabel(status) {
  if (status == null || status === '') return '—';
  return STATUS_LABELS[status] ?? status;
}

export function getStatusColor(status) {
  if (status == null || status === '') return 'bg-gray-100 text-gray-700';
  return STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';
}

const SYSTEM_ROLE_ENUMS = new Set(['RESEARCHER', 'DEPT_HEAD', 'MANAGER', 'COUNCIL', 'ADMIN']);

/** Intra-council assignment roles (topic-scoped). Must never be shown as global system identity. */
const COUNCIL_ASSIGNMENT_ENUMS = new Set(['PRESIDENT', 'SECRETARY', 'REVIEWER', 'MEMBER']);

const ROLE_LABELS = {
  RESEARCHER: 'Nghiên cứu viên',
  DEPT_HEAD: 'Trưởng khoa',
  MANAGER: 'Quản lý KH',
  COUNCIL: 'Chuyên gia Đánh giá',
  ADMIN: 'Quản trị viên',
};

/**
 * Normalizes persisted or JWT-derived role strings to a SystemRole enum name.
 * Strips Spring Security's ROLE_ prefix. Maps erroneous council-assignment
 * values stored in identity claims to COUNCIL so global RBAC and layout stay
 * aligned with the multi-context model.
 */
export function normalizeSystemRole(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const stripped = s.startsWith('ROLE_') ? s.slice(5) : s;
  if (SYSTEM_ROLE_ENUMS.has(stripped)) return stripped;
  if (COUNCIL_ASSIGNMENT_ENUMS.has(stripped)) return 'COUNCIL';
  return null;
}

export function getRoleLabel(role) {
  if (role == null || role === '') return '';
  return ROLE_LABELS[role] ?? role;
}

const COUNCIL_ROLE_LABELS = {
  PRESIDENT: 'Chủ tịch',
  SECRETARY: 'Thư ký',
  REVIEWER: 'Phản biện',
  MEMBER: 'Ủy viên',
};

export function getCouncilRoleLabel(role) {
  return COUNCIL_ROLE_LABELS[role] ?? role;
}

const DECISION_LABELS = {
  PENDING: 'Chưa quyết định',
  APPROVED: 'Thông qua',
  REVISION_REQUIRED: 'Yêu cầu chỉnh sửa',
  REJECTED: 'Không thông qua',
};

export function getDecisionLabel(decision) {
  if (decision == null || decision === '') return '—';
  return DECISION_LABELS[decision] ?? decision;
}
