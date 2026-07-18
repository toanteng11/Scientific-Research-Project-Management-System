// File: src/pages/council/PresidentWorkspacePage.jsx
//
// ─────────────────────────────────────────────────────────────────────────────
// Workspace segregation — PRESIDENT-only unified split-pane.
//
// This page combines the three Presidential duties in a single cohesive screen:
//
//   (A) Session initiation   — "Bắt đầu phiên họp" banner when sessionActive=false
//   (B) Evaluation duty      — scoring form identical to Reviewer's (right-pane tab)
//   (C) Minute finalisation  — review Secretary's draft and Approve / Return
//                               (right-pane tab; fires Topic FSM + notifications)
//
// The President NEVER sees the Secretary's progress-dashboard UI. All monitoring
// information is collapsed into a compact strip in the workspace header.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { councilsApi } from '../../api/councils.api';
import { evaluationsApi } from '../../api/evaluations.api';
import { minutesApi } from '../../api/minutes.api';
import { topicsApi } from '../../api/topics.api';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ForbiddenPage from '../../components/error/ForbiddenPage';
import FocusTrappedModal from '../../components/ui/FocusTrappedModal';
import PdfPreview from '../../components/ui/PdfPreview';
import RichTextDisplay from '../../components/ui/RichTextDisplay';
import { applyFieldErrors } from '../../utils/errorHandler';
import { formatDate, getCouncilRoleLabel, getDecisionLabel } from '../../utils/formatters';

// ─── Constants ───────────────────────────────────────────────────────────────

const POLL_MS = 15000;
const MAX_TOTAL = 100;

const CRITERIA = [
  { id: 'scoreUrgency',     num: 1, title: 'Tính cấp thiết',             maxScore: 15 },
  { id: 'scoreContent',     num: 2, title: 'Mục tiêu & Nội dung',        maxScore: 25 },
  { id: 'scoreObjectives',  num: 3, title: 'Phương pháp & Tính khả thi', maxScore: 20 },
  { id: 'scoreMethodology', num: 4, title: 'Năng lực nghiên cứu',        maxScore: 20 },
  { id: 'scoreFeasibility', num: 5, title: 'Sản phẩm dự kiến',           maxScore: 20 },
];

const DECISION_CONFIG = [
  { id: 'APPROVED',          title: 'Thông qua',          subtitle: 'Đạt, có thể chỉnh sửa nhỏ',
    accent: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100 text-green-600' } },
  { id: 'REVISION_REQUIRED', title: 'Yêu cầu chỉnh sửa',  subtitle: 'Chỉnh sửa lớn, đánh giá lại',
    accent: { border: 'border-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-600' } },
  { id: 'REJECTED',          title: 'Không thông qua',    subtitle: 'Hủy đề tài',
    accent: { border: 'border-red-500',   bg: 'bg-red-50',   text: 'text-red-700',   iconBg: 'bg-red-100 text-red-600' } },
];

// ─── Schema ──────────────────────────────────────────────────────────────────

const evalSchema = yup.object({
  scoreUrgency:     yup.number().typeError('Bắt buộc').required('Bắt buộc').min(0).max(15),
  scoreContent:     yup.number().typeError('Bắt buộc').required('Bắt buộc').min(0).max(25),
  scoreObjectives:  yup.number().typeError('Bắt buộc').required('Bắt buộc').min(0).max(20),
  scoreMethodology: yup.number().typeError('Bắt buộc').required('Bắt buộc').min(0).max(20),
  scoreFeasibility: yup.number().typeError('Bắt buộc').required('Bắt buộc').min(0).max(20),
  generalComment:   yup.string().required('Cần nhập kết luận').min(50, 'Tối thiểu 50 ký tự'),
  recommendedDecision: yup.string().required('Bắt buộc').oneOf(['APPROVED', 'REVISION_REQUIRED', 'REJECTED']),
});

// ─── SVG factory ─────────────────────────────────────────────────────────────

const Svg = ({ d, cls = 'w-5 h-5', sw = 2, fill = 'none' }) => (
  <svg aria-hidden="true" className={`flex-shrink-0 ${cls}`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {[].concat(d).map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)}
  </svg>
);

const IcLeft    = p => <Svg {...p} d="M11 17l-5-5m0 0l5-5m-5 5h12" />;
const IcDoc     = p => <Svg {...p} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />;
const IcCheck   = p => <Svg {...p} d="M5 13l4 4L19 7" />;
const IcX       = p => <Svg {...p} d="M6 18L18 6M6 6l12 12" />;
const IcEdit    = p => <Svg {...p} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />;
const IcLock    = p => <Svg {...p} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />;
const IcPlay    = p => <Svg {...p} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />;
const IcLoader  = p => <Svg {...p} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />;
const IcGavel   = p => <Svg {...p} d="M5 15l6-6m0 0l6 6m-6-6v12M3 3h18" />;
const IcAlert   = p => <Svg {...p} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />;
const IcSparkle = p => <Svg {...p} d="M5 3v4M3 5h4M6.343 6.343l2.829 2.829" />;
const IcStar    = p => <Svg {...p} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: confirm modal shared by Approve / Return actions
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmModal({ title, bodyNode, primaryLabel, primaryTone = 'blue', onConfirm, onClose, busy }) {
  const tone = primaryTone === 'amber'
    ? 'bg-amber-600 hover:bg-amber-700'
    : primaryTone === 'red'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-[#1a5ea8] hover:bg-[#15306a]';
  return (
    <FocusTrappedModal onClose={onClose} dismissible={!busy}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          {!busy && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
              <IcX cls="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="px-6 py-5 text-[13px] text-gray-700 leading-relaxed">{bodyNode}</div>
        <div className="flex gap-3 px-6 pb-6">
          <button disabled={busy} onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Hủy bỏ
          </button>
          <button disabled={busy} onClick={onConfirm}
            className={`flex-1 h-10 rounded-lg text-sm font-bold text-white ${tone} flex items-center justify-center gap-2`}>
            {busy ? <IcLoader cls="w-4 h-4 animate-spin" /> : <IcCheck cls="w-4 h-4" />}
            {primaryLabel}
          </button>
        </div>
      </div>
    </FocusTrappedModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: one criterion row for the evaluation form
// ─────────────────────────────────────────────────────────────────────────────
function CriterionRow({ criterion, register, errors, control, disabled }) {
  const value = useWatch({ control, name: criterion.id });
  const numVal = value === '' || value === undefined ? null : parseFloat(value);
  const invalid = numVal !== null && (isNaN(numVal) || numVal < 0 || numVal > criterion.maxScore);
  const valid = numVal !== null && !invalid;
  const pct = valid ? Math.min(100, (numVal / criterion.maxScore) * 100) : 0;
  return (
    <div className={`rounded-xl border p-3.5 flex flex-col gap-2.5 transition ${
      disabled ? 'border-gray-100 bg-gray-50/50 opacity-60'
        : invalid ? 'border-red-200 bg-red-50/30'
          : valid ? 'border-green-200 bg-green-50/20'
            : 'border-gray-100 bg-white hover:border-blue-100'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-md bg-[#1a5ea8] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
            {criterion.num}
          </span>
          <p className="text-[12.5px] font-bold text-gray-800 leading-tight">{criterion.title}</p>
        </div>
        <span className="text-[10px] font-bold text-[#1a5ea8] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
          Tối đa: {criterion.maxScore}đ
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number" step="0.25" min="0" max={criterion.maxScore} disabled={disabled}
          placeholder="—" {...register(criterion.id)}
          className={`w-16 h-10 px-2 text-center text-base font-black rounded-lg border-2 outline-none transition ${
            invalid ? 'border-red-400 bg-red-50 text-red-700'
              : valid ? 'border-green-400 bg-green-50 text-green-800'
                : 'border-gray-200 bg-gray-50 text-gray-700 focus:border-[#1a5ea8]'
          } disabled:cursor-not-allowed`}
        />
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-gray-500">
            <span>{valid ? numVal : '—'} / {criterion.maxScore}</span>
            {valid && <span className={`font-bold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-500' : 'text-red-400'}`}>{Math.round(pct)}%</span>}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${invalid ? 'bg-red-400' : pct >= 80 ? 'bg-green-400' : pct >= 50 ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${pct}%` }} />
          </div>
          {(invalid || errors[criterion.id]) && (
            <p className="text-[10.5px] text-red-600 font-semibold">
              {errors[criterion.id]?.message || `Tối đa ${criterion.maxScore} điểm`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function PresidentWorkspacePage() {
  const { topicId } = useParams();
  const addToast = useUiStore((s) => s.addToast);
  const userClaims = useAuthStore((s) => s.userClaims);

  // ── Workspace state ───────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [topic, setTopic] = useState(null);
  const [councilDetail, setCouncilDetail] = useState(null);
  const [councilMemberId, setCouncilMemberId] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [minute, setMinute] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [activeAttachmentName, setActiveAttachmentName] = useState('Tài liệu đính kèm');
  const [leftPaneMode, setLeftPaneMode] = useState('PDF');
  const [activeTab, setActiveTab] = useState('EVALUATE');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [myEvaluationSubmitted, setMyEvaluationSubmitted] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'APPROVE' | 'RETURN' | null
  const [returnReason, setReturnReason] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  const pollRef = useRef(null);
  const objectUrlRef = useRef(null);

  // ── Evaluation Form ──────────────────────────────────────────────────────
  const {
    register, control, handleSubmit, setError, setValue, watch,
    formState: { errors: evalErrors },
  } = useForm({
    resolver: yupResolver(evalSchema),
    mode: 'onChange',
    defaultValues: {
      scoreUrgency: '', scoreContent: '', scoreObjectives: '',
      scoreMethodology: '', scoreFeasibility: '',
      generalComment: '', recommendedDecision: '',
    },
  });

  const scores = useWatch({
    control,
    name: ['scoreUrgency', 'scoreContent', 'scoreObjectives', 'scoreMethodology', 'scoreFeasibility'],
  });
  const decisionWatch = watch('recommendedDecision');

  const totalScore = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < scores.length; i++) {
      const v = parseFloat(scores[i]);
      if (!isNaN(v) && v >= 0 && v <= CRITERIA[i].maxScore) sum += v;
    }
    return sum;
  }, [scores]);

  const allCriteriaValid = useMemo(() => {
    for (let i = 0; i < scores.length; i++) {
      const v = parseFloat(scores[i]);
      if (isNaN(v) || v < 0 || v > CRITERIA[i].maxScore) return false;
    }
    return true;
  }, [scores]);

  // ── Data load & polling ──────────────────────────────────────────────────
  const loadData = useCallback(async (opts = {}) => {
    const { silent = false } = opts;
    if (!silent) setLoading(true);
    try {
      const [topicRes, myTopicsList] = await Promise.all([
        topicsApi.getById(topicId),
        councilsApi.fetchAllMyCouncilTopics(),
      ]);
      const assignment = myTopicsList.find((t) => String(t.topicId) === String(topicId));

      if (!assignment || assignment.councilRole !== 'PRESIDENT') {
        setForbidden(true);
        return;
      }

      setTopic(topicRes.data);
      setCouncilMemberId(assignment.councilMemberId);
      const active = topicRes.data?.sessionActive === true
        || topicRes.data?.isSessionActive === true
        || assignment.sessionActive === true
        || assignment.isSessionActive === true;
      setIsSessionActive(active);

      const [councilRes, readyRes] = await Promise.all([
        councilsApi.getById(assignment.councilId),
        councilsApi.getEvaluationStatus(assignment.councilId, topicId),
      ]);
      setCouncilDetail(councilRes.data);
      setReadiness(readyRes.data);

      // Try loading my existing evaluation (if previously submitted)
      if (assignment.councilMemberId) {
        try {
          const evalRes = await evaluationsApi.getMyEvaluation(topicId, assignment.councilMemberId);
          if (evalRes.status === 200 && evalRes.data) {
            const ev = evalRes.data;
            if (ev.submissionStatus === 'SUBMITTED') {
              setValue('scoreUrgency', ev.scoreUrgency, { shouldValidate: true });
              setValue('scoreContent', ev.scoreContent, { shouldValidate: true });
              setValue('scoreObjectives', ev.scoreObjectives, { shouldValidate: true });
              setValue('scoreMethodology', ev.scoreMethodology, { shouldValidate: true });
              setValue('scoreFeasibility', ev.scoreFeasibility, { shouldValidate: true });
              setValue('generalComment', ev.generalComment, { shouldValidate: true });
              setValue('recommendedDecision', ev.recommendedDecision, { shouldValidate: true });
              setMyEvaluationSubmitted(true);
            }
          }
        } catch { /* no prior evaluation */ }
      }

      // Try loading existing minute (Secretary may have drafted)
      try {
        const minuteRes = await minutesApi.getByTopicId(topicId);
        if (minuteRes.data) setMinute(minuteRes.data);
      } catch { /* no minute yet */ }

      // Load PDF on first load only
      if (!opts.silent) {
        const attachments = topicRes.data?.attachments ?? [];
        const preferred = attachments.find((a) => {
          const name = `${a?.fileName ?? ''}`.toLowerCase();
          const mime = `${a?.contentType ?? ''}`.toLowerCase();
          return mime.includes('pdf') || name.endsWith('.pdf');
        }) ?? attachments[0];
        if (preferred) {
          setActiveAttachmentName(preferred.fileName || 'Tài liệu đính kèm');
          try {
            const blobRes = await topicsApi.downloadAttachment(topicId, preferred.attachmentId);
            const url = URL.createObjectURL(blobRes.data);
            objectUrlRef.current = url;
            setPdfUrl(url);
          } catch { /* no pdf */ }
        }
      }
    } catch {
      setForbidden(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [topicId, setValue]);

  useEffect(() => {
    loadData();
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [loadData]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      loadData({ silent: true });
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadData]);

  // ── Computed views ───────────────────────────────────────────────────────
  const total = readiness?.totalNonSecretaries ?? 0;
  const done = readiness?.submittedCount ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isReady = readiness?.ready === true;

  const hasQuorum = useMemo(() => {
    if (!councilDetail?.members?.length) return false;
    const secretary = councilDetail.members.some((m) => m.councilRole === 'SECRETARY');
    const president = councilDetail.members.some((m) => m.councilRole === 'PRESIDENT');
    const evaluatorCount = councilDetail.members.filter((m) => m.councilRole !== 'SECRETARY').length;
    return secretary && president && evaluatorCount > 0;
  }, [councilDetail]);

  const isTimeValid = useMemo(() => {
    if (!councilDetail?.meetingDate) return true;
    const dt = new Date(`${councilDetail.meetingDate}T${councilDetail.meetingTime || '00:00:00'}`);
    return new Date() >= dt;
  }, [councilDetail]);

  const minuteStatus = minute?.minuteStatus;
  const draftReady = minuteStatus === 'DRAFT';
  const minutePublished = minuteStatus === 'PUBLISHED';
  const returnedToSecretary = minuteStatus === 'RETURNED_TO_SECRETARY';

  const isTopicSettled = topic?.topicStatus
    && !['PENDING_COUNCIL', 'COUNCIL_REVIEWED'].includes(topic.topicStatus);

  // Determine which phase the President is in (controls default tab & banners).
  const phase = useMemo(() => {
    if (minutePublished || isTopicSettled) return 'COMPLETED';
    if (draftReady) return 'AWAITING_APPROVAL';
    if (!isSessionActive) return 'NOT_STARTED';
    if (!myEvaluationSubmitted) return 'EVALUATING';
    return 'WAITING_PEERS';
  }, [minutePublished, isTopicSettled, draftReady, isSessionActive, myEvaluationSubmitted]);

  // Auto-switch tab based on phase
  useEffect(() => {
    if (phase === 'AWAITING_APPROVAL' || phase === 'COMPLETED') setActiveTab('APPROVE');
    else setActiveTab('EVALUATE');
  }, [phase]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStartSession = async () => {
    setStartingSession(true);
    try {
      await councilsApi.startTopicSession(topicId);
      addToast({ type: 'success', message: 'Đã bắt đầu phiên họp. Các chuyên gia có thể chấm điểm ngay.' });
      await loadData({ silent: true });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Không thể bắt đầu phiên họp.' });
    } finally {
      setStartingSession(false);
    }
  };

  const onEvaluationSubmit = async (data) => {
    if (!councilMemberId) return;
    setEvalSubmitting(true);
    try {
      await evaluationsApi.submit({
        councilMemberId,
        topicId: Number(topicId),
        scoreUrgency: Number(data.scoreUrgency),
        scoreContent: Number(data.scoreContent),
        scoreObjectives: Number(data.scoreObjectives),
        scoreMethodology: Number(data.scoreMethodology),
        scoreFeasibility: Number(data.scoreFeasibility),
        scoreCapacity: 0,
        scoreProducts: 0,
        generalComment: data.generalComment,
        recommendedDecision: data.recommendedDecision,
      });
      setMyEvaluationSubmitted(true);
      addToast({ type: 'success', message: 'Đã nộp phiếu đánh giá của Chủ tịch. Chờ Thư ký lập biên bản.' });
      await loadData({ silent: true });
    } catch (err) {
      if (err.response?.status === 400) applyFieldErrors(err, setError);
      addToast({ type: 'error', message: err.response?.data?.message || 'Không thể nộp phiếu đánh giá.' });
    } finally {
      setEvalSubmitting(false);
    }
  };

  const handleApproveDraft = async (finalDecision) => {
    if (!minute?.minuteId) return;
    setSubmittingDecision(true);
    try {
      await minutesApi.approve(minute.minuteId, {
        finalDecision,
        legalConfirmation: true,
      });
      setConfirmAction(null);
      addToast({
        type: 'success',
        message: 'Biên bản đã được công bố chính thức. Đề tài đã chuyển trạng thái và thông báo đã được gửi.',
        duration: 4500,
      });
      await loadData({ silent: true });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Không thể phê duyệt biên bản.' });
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleReturnDraft = async () => {
    if (!minute?.minuteId) return;
    setSubmittingDecision(true);
    try {
      await minutesApi.returnToSecretary(minute.minuteId, returnReason);
      setConfirmAction(null);
      setReturnReason('');
      addToast({ type: 'warning', message: 'Đã gửi biên bản trở lại Thư ký để chỉnh sửa.' });
      await loadData({ silent: true });
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Không thể trả biên bản.' });
    } finally {
      setSubmittingDecision(false);
    }
  };

  // ── Early exits ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <LoadingSpinner label="Đang tải phòng làm việc Chủ tịch" sizeClass="h-8 w-8" borderClass="border-b-2 border-[#1a5ea8]" />
      </div>
    );
  }
  if (forbidden) return <ForbiddenPage />;

  const canEvaluate = isSessionActive && !myEvaluationSubmitted && !minutePublished;
  const showEvaluateTab = !minutePublished;
  const showApproveTab = isReady || draftReady || minutePublished || returnedToSecretary;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white overflow-hidden -m-6 border-l border-gray-200">

      {/* ═══ Header ═══ */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center gap-4 flex-shrink-0 z-10">
        <Link to="/council/dashboard" className="flex items-center gap-1.5 text-sm font-semibold text-[#1a5ea8] hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg flex-shrink-0">
          <IcLeft cls="w-4 h-4" /> Về Dashboard
        </Link>
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Phòng làm việc Chủ tịch Hội đồng</p>
          <h2 className="text-sm font-bold text-gray-800 truncate mt-0.5">
            <span className="text-[#1a5ea8]">{topic?.topicCode}</span> — {topic?.titleVn}
          </h2>
          <div className="flex items-center gap-3 mt-1 text-[10.5px] text-gray-500 font-medium flex-wrap">
            {councilDetail?.meetingDate && (
              <span>{formatDate(councilDetail.meetingDate)} · {String(councilDetail.meetingTime || '').slice(0, 5)}</span>
            )}
            {councilDetail?.meetingLocation && <><span className="text-gray-300">•</span><span>{councilDetail.meetingLocation}</span></>}
            {councilDetail?.councilName && <><span className="text-gray-300">•</span><span className="text-[#1a5ea8]">{councilDetail.councilName}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[11.5px] font-bold text-gray-700 leading-tight">{userClaims?.fullName}</p>
            <p className="text-[10px] text-red-500">Chủ tịch Hội đồng</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-[10px] font-bold">
            {userClaims?.fullName?.charAt(0)?.toUpperCase() || 'C'}
          </div>
        </div>
      </header>

      {/* ═══ Action Banner (phase-aware) ═══ */}
      <PhaseBanner
        phase={phase}
        canStart={isTimeValid && hasQuorum}
        isTimeValid={isTimeValid}
        hasQuorum={hasQuorum}
        onStart={handleStartSession}
        starting={startingSession}
        readinessPct={pct}
        done={done}
        total={total}
        returnedToSecretary={returnedToSecretary}
        decision={minute?.finalDecision}
      />

      {/* ═══ Split Pane ═══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: PDF viewer ── */}
        <div className="flex flex-col bg-[#E0E0E0] border-r border-gray-300 shadow-lg" style={{ width: '55%' }}>
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f5f5f5] border-b border-gray-300 flex-shrink-0 gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white shadow-sm text-gray-800 border border-gray-200">
              <IcDoc cls="w-3.5 h-3.5 text-red-500" />
              {leftPaneMode === 'PDF' ? activeAttachmentName : 'Nội dung đề tài'}
            </div>
            <RadioGroup.Root value={leftPaneMode} onValueChange={setLeftPaneMode}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white p-1">
              <RadioGroup.Item value="PDF" className="h-7 px-2.5 rounded-md text-[11px] font-bold text-gray-600 data-[state=checked]:bg-[#1a5ea8] data-[state=checked]:text-white">PDF</RadioGroup.Item>
              <RadioGroup.Item value="DETAIL" className="h-7 px-2.5 rounded-md text-[11px] font-bold text-gray-600 data-[state=checked]:bg-[#1a5ea8] data-[state=checked]:text-white">Nội dung</RadioGroup.Item>
            </RadioGroup.Root>
          </div>
          <div className="flex-1 overflow-auto flex items-start justify-center">
            {leftPaneMode === 'PDF' ? (
              pdfUrl ? (
                <div className="w-full h-full">
                  <PdfPreview fileUrl={pdfUrl} title={activeAttachmentName} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full w-full text-sm text-gray-500 italic">
                  Không tìm thấy tệp PDF đính kèm.
                </div>
              )
            ) : (
              <TopicFallbackView topic={topic} />
            )}
          </div>
        </div>

        {/* ── Right: tabbed action panel ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-white">
          {/* Tab switcher */}
          <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
            {showEvaluateTab && (
              <TabButton active={activeTab === 'EVALUATE'} onClick={() => setActiveTab('EVALUATE')}
                label="Phiếu chấm điểm" icon={<IcStar cls="w-3.5 h-3.5" />}
                badge={myEvaluationSubmitted ? '✓' : null} />
            )}
            {showApproveTab && (
              <TabButton active={activeTab === 'APPROVE'} onClick={() => setActiveTab('APPROVE')}
                label="Biên bản Hội đồng" icon={<IcGavel cls="w-3.5 h-3.5" />}
                badge={draftReady ? '!' : (minutePublished ? '✓' : null)} />
            )}
            <TabButton active={activeTab === 'MONITOR'} onClick={() => setActiveTab('MONITOR')}
              label="Tiến độ" icon={<IcSparkle cls="w-3.5 h-3.5" />} badge={`${done}/${total}`} />
          </div>

          {/* Tab body */}
          <div className="flex-1 overflow-y-auto relative">
            {activeTab === 'EVALUATE' && (
              <EvaluationTab
                register={register} control={control} errors={evalErrors}
                totalScore={totalScore} allValid={allCriteriaValid}
                decisionWatch={decisionWatch} canEvaluate={canEvaluate}
                myEvaluationSubmitted={myEvaluationSubmitted}
                isSessionActive={isSessionActive}
                submitting={evalSubmitting}
                onSubmit={handleSubmit(onEvaluationSubmit)}
              />
            )}

            {activeTab === 'APPROVE' && (
              <ApprovalTab
                minute={minute} isReady={isReady}
                draftReady={draftReady} minutePublished={minutePublished}
                returnedToSecretary={returnedToSecretary}
                readiness={readiness}
                onApprove={(decision) => setConfirmAction({ kind: 'APPROVE', decision })}
                onReturn={() => setConfirmAction({ kind: 'RETURN' })}
              />
            )}

            {activeTab === 'MONITOR' && (
              <MonitorTab councilDetail={councilDetail} readiness={readiness} isSessionActive={isSessionActive} />
            )}
          </div>
        </div>
      </div>

      {/* ═══ Confirm modals ═══ */}
      {confirmAction?.kind === 'APPROVE' && (
        <ConfirmModal
          title="Xác nhận công bố Biên bản Hội đồng"
          bodyNode={(
            <div className="flex flex-col gap-3">
              <p>
                Bạn sắp công bố chính thức biên bản với kết luận{' '}
                <strong className="text-[#1a5ea8]">{getDecisionLabel(confirmAction.decision)}</strong>.
              </p>
              <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Hành động này sẽ <strong>chuyển trạng thái đề tài</strong> và <strong>gửi email</strong> cho Chủ nhiệm đề tài, Trưởng Khoa, và Phòng QLKH. Không thể hoàn tác.
              </p>
            </div>
          )}
          primaryLabel="Xác nhận & Công bố"
          primaryTone="blue"
          busy={submittingDecision}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => handleApproveDraft(confirmAction.decision)}
        />
      )}
      {confirmAction?.kind === 'RETURN' && (
        <ConfirmModal
          title="Trả biên bản về cho Thư ký"
          bodyNode={(
            <div className="flex flex-col gap-3">
              <p>Biên bản sẽ được chuyển sang trạng thái <strong>RETURNED_TO_SECRETARY</strong>. Thư ký có thể chỉnh sửa và gửi lại.</p>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Lý do (tùy chọn)</label>
                <textarea rows={3} value={returnReason} onChange={(e) => setReturnReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1a5ea8] text-[13px] px-3 py-2 outline-none"
                  placeholder="VD: Đề nghị bổ sung phần tổng hợp nhận xét phản biện." />
              </div>
            </div>
          )}
          primaryLabel="Gửi lại cho Thư ký"
          primaryTone="amber"
          busy={submittingDecision}
          onClose={() => { setConfirmAction(null); setReturnReason(''); }}
          onConfirm={handleReturnDraft}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Phase banner
// ═════════════════════════════════════════════════════════════════════════════
function PhaseBanner({ phase, canStart, isTimeValid, hasQuorum, onStart, starting, readinessPct, done, total, returnedToSecretary, decision }) {
  if (phase === 'NOT_STARTED') {
    return (
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
            <IcPlay cls="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-indigo-900">Sẵn sàng khai mạc phiên họp</p>
            <p className="text-[11px] text-indigo-700">
              {!isTimeValid && 'Chưa tới giờ họp theo lịch. '}
              {!hasQuorum && 'Hội đồng chưa đủ thành phần tối thiểu. '}
              {canStart && 'Bấm "Bắt đầu phiên họp" để mở quyền chấm điểm cho toàn bộ thành viên.'}
            </p>
          </div>
        </div>
        <button disabled={!canStart || starting} onClick={onStart}
          className={`flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-bold transition shadow-sm flex-shrink-0 ${
            canStart ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          {starting ? <IcLoader cls="w-4 h-4 animate-spin" /> : <IcPlay cls="w-4 h-4" />}
          Bắt đầu phiên họp
        </button>
      </div>
    );
  }
  if (phase === 'EVALUATING' || phase === 'WAITING_PEERS') {
    return (
      <div className="flex items-center justify-between bg-blue-50 border-b border-blue-100 px-6 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <IcSparkle cls="w-4 h-4 text-[#1a5ea8]" />
          <p className="text-[12.5px] font-semibold text-[#1a5ea8]">
            {phase === 'EVALUATING'
              ? 'Phiên họp đang diễn ra — mời Chủ tịch chấm điểm đề tài.'
              : 'Phiếu của Chủ tịch đã nộp. Chờ Thư ký lập biên bản sau khi các thành viên khác hoàn tất.'}
          </p>
        </div>
        <span className="text-[11.5px] font-bold text-[#1a5ea8] bg-white border border-blue-100 px-3 py-1 rounded-full">
          Tiến độ thu phiếu: {done}/{total} ({readinessPct}%)
        </span>
      </div>
    );
  }
  if (phase === 'AWAITING_APPROVAL') {
    return (
      <div className="flex items-center justify-between bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <IcAlert cls="w-4 h-4 text-amber-600" />
          <p className="text-[12.5px] font-bold text-amber-800">
            Thư ký đã nộp bản nháp biên bản. Mời Chủ tịch xem xét và phê duyệt.
          </p>
        </div>
      </div>
    );
  }
  if (phase === 'COMPLETED') {
    return (
      <div className="flex items-center justify-between bg-green-50 border-b border-green-200 px-6 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <IcCheck cls="w-4 h-4 text-green-600" />
          <p className="text-[12.5px] font-bold text-green-800">
            Biên bản Hội đồng đã được công bố chính thức{decision ? ` — ${getDecisionLabel(decision)}` : ''}.
          </p>
        </div>
      </div>
    );
  }
  if (returnedToSecretary) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex-shrink-0 text-[12.5px] text-amber-800 font-semibold">
        Biên bản đã được trả lại cho Thư ký chỉnh sửa.
      </div>
    );
  }
  return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// Tab button
// ═════════════════════════════════════════════════════════════════════════════
function TabButton({ active, onClick, label, icon, badge }) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-[12px] font-semibold transition border-b-2 ${
        active ? 'border-[#1a5ea8] text-[#1a5ea8] bg-[#eaf5fc]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}>
      {icon}
      {label}
      {badge != null && (
        <span className={`ml-1 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
          active ? 'bg-[#c5e2f5] text-[#1a5ea8]' : 'bg-gray-200 text-gray-600'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Evaluation tab
// ═════════════════════════════════════════════════════════════════════════════
function EvaluationTab({ register, control, errors, totalScore, allValid, decisionWatch, canEvaluate, myEvaluationSubmitted, isSessionActive, submitting, onSubmit }) {
  const totalColor = totalScore >= 85 ? 'text-green-600' : totalScore >= 70 ? 'text-[#1a5ea8]' : totalScore > 0 ? 'text-amber-500' : 'text-gray-300';

  return (
    <div className="flex flex-col h-full">
      {/* Lock overlay if session not active */}
      {!isSessionActive && !myEvaluationSubmitted && (
        <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
          <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-3">
            <IcLock cls="w-6 h-6 text-gray-500" />
          </div>
          <h3 className="text-base font-bold text-gray-800">Phiên họp chưa bắt đầu</h3>
          <p className="text-[12.5px] text-gray-600 mt-1.5 max-w-[280px]">
            Khi Ngài bấm <strong>Bắt đầu phiên họp</strong> ở trên, form chấm điểm sẽ được mở khóa.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Tiêu chí chấm điểm</span>
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[11px] text-gray-400 font-medium">Tối đa: {MAX_TOTAL} điểm</span>
        </div>

        {CRITERIA.map((c) => (
          <CriterionRow key={c.id} criterion={c} register={register} errors={errors} control={control}
            disabled={myEvaluationSubmitted || !isSessionActive} />
        ))}

        <div className="border-t border-dashed border-gray-200 my-1" />

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-bold text-gray-700">Kết luận chung & Kiến nghị <span className="text-red-500">*</span></label>
          <textarea {...register('generalComment')} disabled={myEvaluationSubmitted || !isSessionActive} rows={4}
            placeholder="Nhập kết luận tổng thể về chất lượng đề tài..."
            className={`w-full px-3.5 py-2.5 text-sm rounded-lg outline-none resize-none border disabled:bg-gray-50 disabled:opacity-60 ${
              errors.generalComment ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200 focus:border-[#1a5ea8]'
            }`} />
          {errors.generalComment && <p className="text-[11px] text-red-600 font-semibold">{errors.generalComment.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-bold text-gray-700">Kiến nghị xử lý <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-1 gap-2">
            {DECISION_CONFIG.map((opt) => {
              const selected = decisionWatch === opt.id;
              return (
                <label key={opt.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition ${
                    selected ? `${opt.accent.border} ${opt.accent.bg}` : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                  <input type="radio" {...register('recommendedDecision')} value={opt.id}
                    disabled={myEvaluationSubmitted || !isSessionActive}
                    className="w-4 h-4 text-[#1a5ea8]" />
                  <div>
                    <p className={`text-[12.5px] font-bold ${selected ? opt.accent.text : 'text-gray-700'}`}>{opt.title}</p>
                    <p className="text-[10.5px] text-gray-500">{opt.subtitle}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.recommendedDecision && <p className="text-[11px] text-red-600 font-semibold">{errors.recommendedDecision.message}</p>}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-5 py-3 flex items-center justify-between flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tổng điểm</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-black leading-none ${totalColor}`}>{allValid ? totalScore : '—'}</span>
            <span className="text-sm text-gray-400 font-semibold">/ {MAX_TOTAL}</span>
          </div>
        </div>
        <button disabled={!canEvaluate || !allValid || submitting} onClick={onSubmit}
          className={`flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-bold transition ${
            canEvaluate && allValid && !submitting
              ? 'bg-[#1a5ea8] hover:bg-[#15306a] text-white shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          {submitting ? <IcLoader cls="w-4 h-4 animate-spin" /> : <IcCheck cls="w-4 h-4" />}
          {myEvaluationSubmitted ? 'Đã nộp phiếu' : 'Nộp phiếu chấm điểm'}
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Approval tab
// ═════════════════════════════════════════════════════════════════════════════
function ApprovalTab({ minute, isReady, draftReady, minutePublished, returnedToSecretary, readiness, onApprove, onReturn }) {
  const [chosenDecision, setChosenDecision] = useState(null);
  const evaluations = readiness?.evaluations || [];
  const averageScore = minute?.averageScore ?? readiness?.averageScore ?? null;

  // Empty state: no draft yet
  if (!minute && !isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <IcDoc cls="w-6 h-6 text-gray-500" />
        </div>
        <h3 className="text-base font-bold text-gray-800">Chưa có biên bản</h3>
        <p className="text-[12.5px] text-gray-600 mt-1.5 max-w-[320px]">
          Thư ký sẽ lập nháp biên bản sau khi thu đủ 100% phiếu đánh giá. Biên bản sẽ hiển thị tại đây để Ngài phê duyệt.
        </p>
      </div>
    );
  }
  if (!minute && isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <IcAlert cls="w-6 h-6 text-[#1a5ea8]" />
        </div>
        <h3 className="text-base font-bold text-gray-800">Đủ điều kiện — chờ Thư ký lập biên bản</h3>
        <p className="text-[12.5px] text-gray-600 mt-1.5 max-w-[320px]">
          Hệ thống đã thu đủ phiếu đánh giá. Thư ký sẽ sớm nộp bản nháp biên bản.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

        {returnedToSecretary && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[12.5px] text-amber-800">
            Biên bản đang được Thư ký chỉnh sửa lại theo yêu cầu của Ngài.
          </div>
        )}
        {minutePublished && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-[12.5px] text-green-800">
            <strong>Đã công bố chính thức.</strong> Kết luận: {getDecisionLabel(minute.finalDecision)}. Thông báo đã được gửi đến các bên liên quan.
          </div>
        )}

        {/* Score summary */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-200 bg-white">
            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Tổng hợp điểm</p>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="py-2 px-3 text-left font-bold text-[10px] text-gray-500 uppercase">Thành viên</th>
                <th className="py-2 px-3 text-center font-bold text-[10px] text-gray-500 uppercase">Vai trò</th>
                <th className="py-2 px-3 text-right font-bold text-[10px] text-gray-500 uppercase">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                  <td className="py-2 px-3">{ev.evaluatorFullName}</td>
                  <td className="py-2 px-3 text-center text-[11px] text-gray-500">{getCouncilRoleLabel(ev.councilRole)}</td>
                  <td className="py-2 px-3 text-right font-black">{ev.totalScore?.toFixed(2) ?? '—'}</td>
                </tr>
              ))}
              <tr className="bg-blue-50 border-t border-blue-200">
                <td colSpan={2} className="py-2 px-3 font-bold text-[#1a5ea8] uppercase text-[10.5px]">Trung bình Hội đồng</td>
                <td className="py-2 px-3 text-right text-[14px] font-black text-[#1a5ea8]">
                  {averageScore != null ? Number(averageScore).toFixed(2) : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Draft content */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-50 flex items-center gap-2">
            <IcDoc cls="w-3.5 h-3.5 text-[#1a5ea8]" />
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Nội dung biên bản Thư ký lập</p>
          </div>
          <div className="p-4 text-[12.5px] text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[280px] overflow-y-auto">
            {minute?.synthesizedComments || <span className="italic text-gray-400">Chưa có nội dung.</span>}
          </div>
        </div>

        {/* Decision picker (active only while draft pending) */}
        {draftReady && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Kết luận chính thức của Chủ tịch</p>
            <div className="grid grid-cols-3 gap-2">
              {DECISION_CONFIG.map((opt) => {
                const selected = chosenDecision === opt.id;
                return (
                  <button key={opt.id} onClick={() => setChosenDecision(opt.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition ${
                      selected ? `${opt.accent.border} ${opt.accent.bg}` : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selected ? opt.accent.iconBg : 'bg-gray-100 text-gray-400'
                    }`}>
                      {opt.id === 'APPROVED' ? <IcCheck cls="w-4 h-4" />
                        : opt.id === 'REVISION_REQUIRED' ? <IcEdit cls="w-4 h-4" />
                        : <IcX cls="w-4 h-4" />}
                    </div>
                    <p className={`text-[11.5px] font-bold ${selected ? opt.accent.text : 'text-gray-700'}`}>{opt.title}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      {draftReady && (
        <div className="border-t border-gray-200 bg-white px-5 py-3 flex items-center justify-between flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <button onClick={onReturn}
            className="flex items-center gap-2 h-10 px-5 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 text-sm font-bold transition">
            <IcEdit cls="w-4 h-4" /> Trả cho Thư ký
          </button>
          <button disabled={!chosenDecision} onClick={() => onApprove(chosenDecision)}
            className={`flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-bold transition shadow-sm ${
              chosenDecision ? 'bg-[#1a5ea8] hover:bg-[#15306a] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
            <IcGavel cls="w-4 h-4" /> Phê duyệt & Công bố
          </button>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Monitor tab (compact)
// ═════════════════════════════════════════════════════════════════════════════
function MonitorTab({ councilDetail, readiness, isSessionActive }) {
  const members = councilDetail?.members ?? [];
  const total = readiness?.totalNonSecretaries ?? 0;
  const done = readiness?.submittedCount ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Tiến độ thu phiếu</p>
          <span className="text-[11.5px] font-bold text-[#1a5ea8]">{done}/{total} ({pct}%)</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#1a5ea8] rounded-full" style={{ width: `${pct}%` }} />
        </div>
        {!isSessionActive && (
          <p className="text-[11px] text-amber-600 mt-2 font-medium">Phiên họp chưa bắt đầu.</p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Thành viên Hội đồng</p>
        </div>
        <table className="w-full text-[12.5px]">
          <tbody>
            {members.map((m) => {
              const evData = readiness?.evaluations?.find((e) => e.councilMemberId === m.councilMemberId);
              const isSec = m.councilRole === 'SECRETARY';
              return (
                <tr key={m.councilMemberId} className="border-b border-gray-100">
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-gray-800">{m.fullName}</p>
                    <p className="text-[10.5px] text-gray-500">{getCouncilRoleLabel(m.councilRole)}</p>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {isSec ? <span className="text-[11px] text-gray-400 italic">—</span>
                      : evData ? <span className="text-[11px] font-bold text-green-600">{evData.totalScore?.toFixed(2)}đ ✓</span>
                      : <span className="text-[11px] text-amber-500 font-semibold">Chờ nộp</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Topic fallback view (right side of PDF when no PDF)
// ═════════════════════════════════════════════════════════════════════════════
function TopicFallbackView({ topic }) {
  const sections = [
    { key: 'urgencyStatement', label: 'Tính cấp thiết' },
    { key: 'generalObjective', label: 'Mục tiêu tổng quát' },
    { key: 'specificObjectives', label: 'Mục tiêu cụ thể' },
    { key: 'researchMethods', label: 'Phương pháp nghiên cứu' },
    { key: 'researchScope', label: 'Phạm vi nghiên cứu' },
  ];
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 w-full">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mã đề tài</p>
        <p className="text-sm font-bold text-[#1a5ea8] mt-1">{topic?.topicCode || '—'}</p>
        <p className="text-[13px] font-bold text-gray-800 mt-2">{topic?.titleVn || '—'}</p>
      </div>
      {sections.map((s) => (
        topic?.[s.key] ? (
          <div key={s.key} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <p className="text-[11px] font-bold text-gray-700">{s.label}</p>
            </div>
            <div className="px-4 py-3 prose prose-sm max-w-none">
              <RichTextDisplay html={topic[s.key]} />
            </div>
          </div>
        ) : null
      ))}
    </div>
  );
}
