// File: src/pages/council/EvaluationFormPage.jsx

import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// ─── PDF Viewer Imports ───────────────────────────────────────────────────────────

// ─── API & Stores ─────────────────────────────────────────────────────────────────
import { evaluationsApi } from '../../api/evaluations.api';
import { councilsApi } from '../../api/councils.api';
import { topicsApi } from '../../api/topics.api';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import ForbiddenPage from '../../components/error/ForbiddenPage';
import FocusTrappedModal from '../../components/ui/FocusTrappedModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PdfPreview from '../../components/ui/PdfPreview';
import RichTextDisplay from '../../components/ui/RichTextDisplay';
import { applyFieldErrors } from '../../utils/errorHandler';
import { getCouncilRoleLabel } from '../../utils/formatters';

// ─── Configurations ───────────────────────────────────────────────────────────────

const MAX_TOTAL = 100;

const CRITERIA = [
  { id: "scoreUrgency",     num: 1, title: "Tính cấp thiết",             maxScore: 15 },
  { id: "scoreContent",     num: 2, title: "Mục tiêu & Nội dung",        maxScore: 25 },
  { id: "scoreObjectives",  num: 3, title: "Phương pháp & Tính khả thi", maxScore: 20 },
  { id: "scoreMethodology", num: 4, title: "Năng lực nghiên cứu",        maxScore: 20 },
  { id: "scoreFeasibility", num: 5, title: "Sản phẩm dự kiến",           maxScore: 20 },
];

const GRADE_CFG = {
  XUAT_SAC:  { style: "bg-green-100 text-green-700 border-green-200", short: "TỐT / XUẤT SẮC" },
  DAT:       { style: "bg-blue-100 text-blue-700 border-blue-200",    short: "KHÁ / ĐẠT" },
  KHONG_DAT: { style: "bg-red-100 text-red-700 border-red-200",       short: "KHÔNG ĐẠT" }
};

const DECISION_CONFIG = [
  { id: "APPROVED", title: "Thông qua", subtitle: "Đạt", accent: { border: "border-green-500", bg: "bg-green-50", ring: "ring-green-500/20", text: "text-green-700", sub: "text-green-600", badge: "bg-green-500 text-white", iconBg: "bg-green-100 text-green-600" } },
  { id: "REVISION_REQUIRED", title: "Cần chỉnh sửa", subtitle: "Yêu cầu chỉnh sửa", accent: { border: "border-amber-500", bg: "bg-amber-50", ring: "ring-amber-500/20", text: "text-amber-700", sub: "text-amber-600", badge: "bg-amber-500 text-white", iconBg: "bg-amber-100 text-amber-600" } },
  { id: "REJECTED", title: "Không thông qua", subtitle: "Hủy đề tài", accent: { border: "border-red-500", bg: "bg-red-50", ring: "ring-red-500/20", text: "text-red-700", sub: "text-red-600", badge: "bg-red-500 text-white", iconBg: "bg-red-100 text-red-600" } }
];

const suggestGrade = (score) => {
  if (score >= 85) return "XUAT_SAC";
  if (score >= 70) return "DAT";
  return "KHONG_DAT";
};

const EVALUATION_ROLES = new Set(['PRESIDENT', 'MEMBER', 'REVIEWER', 'REVIEWER_1', 'REVIEWER_2']);

// ─── Schema Validation ────────────────────────────────────────────────────────

const schema = yup.object({
  scoreUrgency: yup.number().typeError('Bắt buộc').required('Bắt buộc').min(0).max(15),
  scoreContent: yup.number().typeError('Bắt buộc').required('Bắt buộc').min(0).max(25),
  scoreObjectives: yup.number().typeError('Bắt buộc').required('Bắt buộc').min(0).max(20),
  scoreMethodology: yup.number().typeError('Bắt buộc').required('Bắt buộc').min(0).max(20),
  scoreFeasibility: yup.number().typeError('Bắt buộc').required('Bắt buộc').min(0).max(20),
  scoreCapacity: yup.number().default(0),
  scoreProducts: yup.number().default(0),
  generalComment: yup.string().required('Cần nhập kết luận').min(50, 'Tối thiểu 50 ký tự'),
  recommendedDecision: yup.string().required('Bắt buộc').oneOf(['APPROVED', 'REVISION_REQUIRED', 'REJECTED']),
  gradeAuto: yup.string().required('Cần xếp loại'), 
});

// ─── SVG Factory ────────────────────────────────────────────────────────────────

const Svg = ({ d, cls = "w-5 h-5", sw = 2, fill = "none" }) => (
  <svg aria-hidden="true" className={`flex-shrink-0 ${cls}`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {[].concat(d).map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)}
  </svg>
);

const IcLeft      = p => <Svg {...p} d="M11 17l-5-5m0 0l5-5m-5 5h12" />;
const IcCheck     = p => <Svg {...p} d="M5 13l4 4L19 7" />;
const IcX         = p => <Svg {...p} d="M6 18L18 6M6 6l12 12" />;
const IcAlert     = p => <Svg {...p} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />;
const IcSave      = p => <Svg {...p} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />;
const IcClipboard = p => <Svg {...p} d={["M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2", "M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"]} />;
const IcStar      = p => <Svg {...p} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />;
const IcDoc       = p => <Svg {...p} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />;
const IcLoader    = p => <Svg {...p} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />;
const IcLock      = p => <Svg {...p} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />;

// ─── Components ───────────────────────────────────────────────────────────────

const ConfirmModal = ({ totalScore, grade, onClose, onConfirm, submitting }) => {
  const gradeCfg = GRADE_CFG[grade];

  return (
    <FocusTrappedModal onClose={onClose} dismissible={!submitting}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-end px-4 pt-4">
          {!submitting && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
              <IcX cls="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex flex-col items-center text-center px-8 pb-8 gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <IcSave cls="w-8 h-8 text-[#1a5ea8]" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">Xác nhận nộp Phiếu đánh giá?</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Bạn sẽ <strong className="text-gray-700">không thể sửa lại</strong> sau khi Thư ký chốt Biên bản Hội đồng.
            </p>
          </div>

          <div className="w-full bg-gray-50 rounded-xl p-3.5 flex items-center justify-between border border-gray-100 gap-3">
            <div className="text-left">
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Tổng điểm</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-[#1a5ea8] leading-none">{totalScore}</span>
                <span className="text-sm font-semibold text-gray-400">/ {MAX_TOTAL}</span>
              </div>
            </div>
            {gradeCfg && (
              <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${gradeCfg.style}`}>
                {gradeCfg.short}
              </span>
            )}
          </div>

          <div className="flex gap-3 w-full">
            <button disabled={submitting} onClick={onClose} className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Hủy
            </button>
            <button disabled={submitting} onClick={onConfirm} className={`flex-1 h-10 rounded-lg text-sm font-bold transition shadow-sm ${submitting ? 'bg-[#1a5ea8]/70 text-white cursor-wait' : 'bg-[#1a5ea8] hover:bg-[#15306a] text-white'}`}>
              {submitting ? 'Đang nộp...' : 'Xác nhận nộp'}
            </button>
          </div>
        </div>
      </div>
    </FocusTrappedModal>
  );
};

// ─── Score Row UI ─────────────────────────────────────────────────────────────────

const CriterionRow = ({ criterion, register, errors, control, disabled }) => {
  const value = useWatch({ control, name: criterion.id });
  const rawStr = value === "" || value === undefined ? "" : String(value);
  const numVal = rawStr === "" ? null : parseFloat(rawStr);
  const isInvalid = numVal !== null && (isNaN(numVal) || numVal < 0 || numVal > criterion.maxScore);
  const isValid = numVal !== null && !isInvalid;
  const pct = isValid ? Math.min(100, (numVal / criterion.maxScore) * 100) : 0;

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
      disabled     ? "border-gray-100 bg-gray-50/50 opacity-60"
      : isInvalid  ? "border-red-200 bg-red-50/30"
      : isValid    ? "border-green-200 bg-green-50/20"
      :              "border-gray-100 bg-white hover:border-blue-100"
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-[#1a5ea8] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
            {criterion.num}
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-gray-800 leading-tight">{criterion.title}</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-[#1a5ea8] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
          Tối đa: {criterion.maxScore}đ
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1 flex-shrink-0">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center">Điểm</span>
          <input
            type="number"
            step="0.25"
            min="0"
            max={criterion.maxScore}
            disabled={disabled}
            placeholder="—"
            {...register(criterion.id)}
            className={`w-[72px] h-11 px-2 text-center text-lg font-black rounded-lg border-2 outline-none transition disabled:cursor-not-allowed ${
              isInvalid
                ? "border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-200"
                : isValid
                  ? "border-green-400 bg-green-50 text-green-800 focus:ring-2 focus:ring-green-200"
                  : "border-gray-200 bg-gray-50 text-gray-700 focus:border-[#1a5ea8] focus:ring-2 focus:ring-[#1a5ea8]/10 focus:bg-white"
            }`}
          />
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">
              {isValid ? `${numVal}` : "—"} / {criterion.maxScore} điểm
            </span>
            {isValid && (
              <span className={`text-[11px] font-bold ${pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-500" : "text-red-400"}`}>
                {Math.round(pct)}%
              </span>
            )}
          </div>
          
          <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden flex items-center">
            <div 
              className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 pointer-events-none ${
                isInvalid ? "bg-red-400" : pct >= 80 ? "bg-green-400" : pct >= 50 ? "bg-amber-400" : "bg-blue-400"
              }`} 
              style={{ width: `${pct}%` }} 
            />
            <input 
              type="range" 
              min="0" 
              max={criterion.maxScore} 
              step="0.25"
              value={isValid ? numVal : 0}
              disabled={disabled}
              onChange={(e) => {
                const el = document.querySelector(`input[name="${criterion.id}"]`);
                if (el) {
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                  nativeInputValueSetter.call(el, e.target.value);
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
            />
          </div>

          {(isInvalid || errors[criterion.id]) && (
            <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 mt-0.5">
              <IcAlert cls="w-3 h-3 flex-shrink-0" /> {errors[criterion.id]?.message || `Tối đa ${criterion.maxScore} điểm`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const TopicContextFallback = ({ topic }) => {
  const richSections = [
    { key: 'urgencyStatement', label: 'Tính cấp thiết' },
    { key: 'generalObjective', label: 'Mục tiêu tổng quát' },
    { key: 'specificObjectives', label: 'Mục tiêu cụ thể' },
    { key: 'researchMethods', label: 'Phương pháp nghiên cứu' },
    { key: 'researchScope', label: 'Phạm vi nghiên cứu' },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mã đề tài</p>
        <p className="text-sm font-bold text-[#1a5ea8] mt-1">{topic?.topicCode || '—'}</p>
        <p className="text-[13px] font-bold text-gray-800 mt-2">{topic?.titleVn || '—'}</p>
        {topic?.titleEn && <p className="text-xs text-gray-500 mt-1">{topic.titleEn}</p>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 grid grid-cols-1 gap-2">
        <p className="text-xs"><span className="font-semibold">Chủ nhiệm:</span> {topic?.investigatorFullName || '—'}</p>
        <p className="text-xs"><span className="font-semibold">Đơn vị:</span> {topic?.managingDepartmentName || '—'}</p>
        <p className="text-xs"><span className="font-semibold">Thời gian:</span> {topic?.durationMonths ? `${topic.durationMonths} tháng` : '—'}</p>
      </div>

      {richSections.map((section) => (
        topic?.[section.key] ? (
          <div key={section.key} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <p className="text-[11px] font-bold text-gray-700">{section.label}</p>
            </div>
            <div className="px-4 py-3 prose prose-sm max-w-none">
              <RichTextDisplay html={topic[section.key]} />
            </div>
          </div>
        ) : null
      ))}
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

export default function EvaluationFormPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const userClaims = useAuthStore((s) => s.userClaims);
  const addToast = useUiStore((s) => s.addToast);

  // States
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [topic, setTopic] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [activeAttachmentName, setActiveAttachmentName] = useState('Tài liệu đính kèm');
  const [leftPaneMode, setLeftPaneMode] = useState('PDF');
  const [councilMemberId, setCouncilMemberId] = useState(null);
  const [assignmentRole, setAssignmentRole] = useState(null);
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Hook Form
  const { register, handleSubmit, control, setError, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      scoreUrgency: '', scoreContent: '', scoreObjectives: '',
      scoreMethodology: '', scoreFeasibility: '', scoreCapacity: 0, scoreProducts: 0,
      generalComment: '', recommendedDecision: '', gradeAuto: ''
    },
  });

  const scores = useWatch({
    control,
    name: ['scoreUrgency', 'scoreContent', 'scoreObjectives', 'scoreMethodology', 'scoreFeasibility'],
  });
  const conclusion = watch('generalComment');
  const decision = watch('recommendedDecision');
  const grade = watch('gradeAuto');

  // ABAC Guard & Load
  useEffect(() => {
    let objectUrl;
    const load = async () => {
      try {
        const [topicRes, myTopicsList] = await Promise.all([
          topicsApi.getById(topicId),
          councilsApi.fetchAllMyCouncilTopics(),
        ]);
        setTopic(topicRes.data);

        const assignment = myTopicsList.find((t) => String(t.topicId) === String(topicId));

        if (!assignment) {
          setForbidden(true);
          return;
        }

        if (assignment.councilRole === 'SECRETARY') {
          navigate(`/council/topics/${topicId}/session`, { replace: true });
          return;
        }

        // Workspace Segregation: Chủ tịch có Phòng làm việc riêng (Split-Pane).
        if (assignment.councilRole === 'PRESIDENT') {
          navigate(`/council/topics/${topicId}/president`, { replace: true });
          return;
        }

        if (!EVALUATION_ROLES.has(assignment.councilRole)) {
          setForbidden(true);
          return;
        }

        const active = assignment.sessionActive === true || assignment.isSessionActive === true || topicRes.data?.sessionActive === true || topicRes.data?.isSessionActive === true;
        setIsSessionActive(active);

        if (assignment.councilMemberId) {
          setCouncilMemberId(assignment.councilMemberId);
          setAssignmentRole(assignment.councilRole);

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
                setSubmitted(true);
              }
            }
          } catch { /* 204 No Content or network error — no prior evaluation */ }
        }

        const attachments = topicRes.data?.attachments ?? [];
        const preferredAttachment = attachments.find((att) => {
          const name = `${att?.fileName ?? ''}`.toLowerCase();
          const mimeType = `${att?.contentType ?? ''}`.toLowerCase();
          return mimeType.includes('pdf') || name.endsWith('.pdf');
        }) ?? attachments[0];

        if (preferredAttachment) {
          setActiveAttachmentName(preferredAttachment.fileName || 'Tài liệu đính kèm');
          try {
            const blobRes = await topicsApi.downloadAttachment(topicId, preferredAttachment.attachmentId);
            objectUrl = URL.createObjectURL(blobRes.data);
            setPdfUrl(objectUrl);
          } catch {
            setPdfUrl(null);
          }
        }
      } catch { /* Interceptor */ }
      finally { setLoading(false); }
    };
    load();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [topicId, navigate, setValue]);

  // [BỔ SUNG]: Polling cơ chế thời gian thực để mở khóa Form ngay lập tức khi Thư ký bấm bắt đầu
  useEffect(() => {
    let interval;
    if (!isSessionActive && !forbidden && !loading) {
      interval = setInterval(async () => {
        try {
          const res = await topicsApi.getById(topicId);
          if (res.data?.sessionActive === true || res.data?.isSessionActive === true) {
            setIsSessionActive(true);
            addToast({ type: 'success', message: 'Thư ký đã bắt đầu phiên họp. Form chấm điểm đã được mở khóa!', duration: 5000 });
          }
        } catch {
          // silent - [VÁ LỖI ESLINT NO-UNUSED-VARS]
        }
      }, 10000); // Quét mỗi 10 giây
    }
    return () => clearInterval(interval);
  }, [isSessionActive, forbidden, loading, topicId, addToast]);

  // Total Calculation
  const totalScore = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < scores.length; i++) {
      const val = parseFloat(scores[i]);
      if (!isNaN(val) && val >= 0 && val <= CRITERIA[i].maxScore) {
        sum += val;
      }
    }
    return sum;
  }, [scores]);

  // Auto-grade Logic
  const allCriteriaFilledAndValid = useMemo(() => {
    for (let i = 0; i < scores.length; i++) {
      const val = parseFloat(scores[i]);
      if (isNaN(val) || val < 0 || val > CRITERIA[i].maxScore) return false;
    }
    return true;
  }, [scores]);

  useEffect(() => {
    if (allCriteriaFilledAndValid && !submitted) {
      const suggested = suggestGrade(totalScore);
      setValue('gradeAuto', suggested, { shouldValidate: true });
    }
  }, [totalScore, allCriteriaFilledAndValid, setValue, submitted]);

  useEffect(() => {
    if (!justSubmitted) return undefined;
    const t = setTimeout(() => navigate('/council/dashboard'), 3500);
    return () => clearTimeout(t);
  }, [justSubmitted, navigate]);

  const canSave = allCriteriaFilledAndValid && conclusion?.trim().length > 0 && decision !== "" && !submitted && isSessionActive;

  const onSubmit = async (data) => {
    if (!councilMemberId) return;
    setSubmitting(true);
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
      setConfirmOpen(false);
      setSubmitted(true);
      setJustSubmitted(true);
      addToast({
        type: 'success',
        message: 'Đã lưu phiếu đánh giá thành công. Cảm ơn bạn đã hoàn thành nhiệm vụ Hội đồng!',
        duration: 3500,
      });
    } catch (err) {
      if (err.response?.status === 400) applyFieldErrors(err, setError);
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <LoadingSpinner label="Đang tải phiếu đánh giá" sizeClass="h-8 w-8" borderClass="border-b-2 border-[#1a5ea8]" />
      </div>
    );
  }

  if (forbidden) return <ForbiddenPage />;

  const totalPct = Math.round((totalScore / MAX_TOTAL) * 100);
  const gradeCfg = GRADE_CFG[grade];
  const totalColor = totalScore >= 85 ? "text-green-600" : totalScore >= 70 ? "text-[#1a5ea8]" : totalScore > 0 ? "text-amber-500" : "text-gray-300";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white overflow-hidden -m-6 border-l border-gray-200">
      
      {/* ══ Top Header ══ */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-3.5 flex items-center gap-4 flex-shrink-0 z-10">
        <Link to="/council/dashboard" className="flex items-center gap-1.5 text-sm font-semibold text-[#1a5ea8] hover:text-blue-900 transition flex-shrink-0 bg-blue-50 px-3 py-1.5 rounded-lg">
          <IcLeft cls="w-4 h-4" /> Về Dashboard
        </Link>
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SC-COUNCIL-02 · Phiếu đánh giá đề tài</p>
          <h2 className="text-sm font-bold text-gray-800 truncate leading-tight mt-0.5">
            <span className="text-[#1a5ea8]">{topic?.topicCode}</span> — {topic?.titleVn}
          </h2>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[11.5px] font-bold text-gray-700 leading-tight">{userClaims?.fullName}</p>
            <p className="text-[10px] text-[#4a7faa]">
              {assignmentRole ? getCouncilRoleLabel(assignmentRole) : '—'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {userClaims?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          {submitted && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
              <IcCheck cls="w-3 h-3" /> Đã nộp
            </span>
          )}
        </div>
      </header>

      {/* ══ Split-screen body ══ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ────────────────────── Left Panel: Document Viewer (55%) ────────────────────── */}
        <div className="flex flex-col bg-[#E0E0E0] border-r border-gray-300 z-10 shadow-lg" style={{ width: "55%" }}>
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f5f5f5] border-b border-gray-300 flex-shrink-0 gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white shadow-sm text-gray-800 border border-gray-200">
              <IcDoc cls="w-3.5 h-3.5 text-red-500" />
              {leftPaneMode === 'PDF' ? activeAttachmentName : 'Nội dung khoa học đăng ký'}
            </div>
            <RadioGroup.Root
              value={leftPaneMode}
              onValueChange={setLeftPaneMode}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white p-1"
              aria-label="Chế độ xem hồ sơ"
            >
              <RadioGroup.Item
                value="PDF"
                className="h-7 px-2.5 rounded-md text-[11px] font-bold text-gray-600 data-[state=checked]:bg-[#1a5ea8] data-[state=checked]:text-white"
              >
                PDF
              </RadioGroup.Item>
              <RadioGroup.Item
                value="DETAIL"
                className="h-7 px-2.5 rounded-md text-[11px] font-bold text-gray-600 data-[state=checked]:bg-[#1a5ea8] data-[state=checked]:text-white"
              >
                Nội dung
              </RadioGroup.Item>
            </RadioGroup.Root>
          </div>
          <div className="flex-1 overflow-auto flex items-start justify-center">
            {leftPaneMode === 'PDF' ? (pdfUrl ? (
              <div className="w-full h-full">
                <PdfPreview fileUrl={pdfUrl} title={activeAttachmentName} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full w-full text-sm text-gray-500 font-medium italic">
                Không tìm thấy tệp PDF đính kèm.
              </div>
            )) : <TopicContextFallback topic={topic} />}
          </div>
        </div>

        {/* ────────────────────── Right Panel: Evaluation Form (45%) ────────────────────── */}
        <div className="flex flex-col bg-white overflow-hidden relative" style={{ width: "45%" }}>
          
          {/* LỚP PHỦ KHÓA FORM KHI CHƯA BẮT ĐẦU */}
          {!isSessionActive && !submitted && (
            <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                <IcLock cls="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Phiên họp chưa bắt đầu</h3>
              <p className="text-sm text-gray-600 mt-2 max-w-[300px] leading-relaxed">
                Bạn có thể đọc Thuyết minh đề tài ở bên trái. Form chấm điểm sẽ tự động mở khóa ngay khi Thư ký điều hành bấm nút Bắt đầu.
              </p>
              <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold animate-pulse">
                <IcLoader cls="w-4 h-4 animate-spin" /> Đang chờ Thư ký...
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-white flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <IcClipboard cls="w-4 h-4 text-[#1a5ea8]" />
                <h3 className="text-sm font-bold text-gray-800">Phiếu Chấm điểm & Đánh giá</h3>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                allCriteriaFilledAndValid ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-100 border-gray-200 text-gray-500"
              }`}>
                {CRITERIA.length} tiêu chí
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <IcStar cls="w-3.5 h-3.5 text-[#1a5ea8]" />
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Tiêu chí chấm điểm</span>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 font-medium">Tổng tối đa: {MAX_TOTAL} điểm</span>
            </div>

            {CRITERIA.map(c => (
              <CriterionRow key={c.id} criterion={c} register={register} errors={errors} control={control} disabled={submitted || !isSessionActive} />
            ))}

            {allCriteriaFilledAndValid && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
                totalScore >= 85 ? "bg-green-50 border-green-200" : totalScore >= 70 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"
              }`}>
                <IcCheck cls={`w-4 h-4 ${totalScore >= 70 ? "text-green-500" : "text-amber-400"} flex-shrink-0`} />
                <p className="text-[12px] font-semibold text-gray-700">
                  Tổng điểm hiện tại: <strong className={totalColor}>{totalScore}</strong> / {MAX_TOTAL}
                  {gradeCfg && (
                    <span className={`ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full border ${gradeCfg.style}`}>→ {gradeCfg.short}</span>
                  )}
                </p>
              </div>
            )}

            <div className="border-t border-dashed border-gray-200 my-1" />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold text-gray-700">Kết luận chung & Kiến nghị <span className="text-red-500 ml-0.5">*</span></label>
              </div>
              <textarea {...register('generalComment')} disabled={submitted || !isSessionActive} rows={5} placeholder="Nhập kết luận tổng thể về chất lượng đề tài..."
                className={`w-full px-3.5 py-3 text-sm text-gray-800 placeholder-gray-400 rounded-lg outline-none resize-none transition border disabled:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed ${errors.generalComment ? 'border-red-500 ring-2 ring-red-500/10' : 'border-gray-200 focus:border-[#1a5ea8] focus:ring-2 focus:ring-[#1a5ea8]/10'}`} />
              {errors.generalComment && <p className="text-[11px] text-red-600 font-semibold">{errors.generalComment.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold text-gray-700">Kiến nghị xử lý <span className="text-red-500 ml-0.5">*</span></label>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {DECISION_CONFIG.map(opt => {
                  const isSelected = decision === opt.id;
                  return (
                    <label key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? `${opt.accent.border} ${opt.accent.bg}` : "border-gray-200 bg-white hover:border-gray-300"}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" {...register('recommendedDecision')} value={opt.id} disabled={submitted || !isSessionActive} className="w-4 h-4 text-[#1a5ea8] border-gray-300 focus:ring-[#1a5ea8]" />
                        <div>
                          <p className={`text-[13px] font-bold ${isSelected ? opt.accent.text : "text-gray-700"}`}>{opt.title}</p>
                          <p className="text-[11px] text-gray-500">{opt.subtitle}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.recommendedDecision && <p className="text-[11px] text-red-600 font-semibold">{errors.recommendedDecision.message}</p>}
            </div>

            <div className="h-1" />
          </div>

          {/* ── Sticky Footer ── */}
          <div className="border-t border-gray-200 bg-white px-5 py-4 flex items-center justify-between flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-20">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tổng điểm</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-2xl font-black leading-none transition-colors ${totalColor}`}>
                  {allCriteriaFilledAndValid ? totalScore : "—"}
                </span>
                <span className="text-sm text-gray-400 font-semibold">/ {MAX_TOTAL}</span>
                {grade && allCriteriaFilledAndValid && gradeCfg && (
                  <span className={`ml-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${gradeCfg.style}`}>{gradeCfg.short}</span>
                )}
              </div>
              {allCriteriaFilledAndValid && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${totalScore >= 85 ? "bg-green-400" : totalScore >= 70 ? "bg-blue-400" : "bg-amber-400"}`} style={{ width: `${totalPct}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400">{totalPct}%</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              <button
                disabled={!canSave}
                onClick={handleSubmit(() => setConfirmOpen(true))}
                className={`flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-bold transition ${canSave ? "bg-[#1a5ea8] hover:bg-[#15306a] text-white shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                <IcSave cls="w-4 h-4" />
                {submitted ? "Đã nộp phiếu" : "Lưu phiếu điểm"}
              </button>
              {!canSave && !submitted && (
                <p className="text-[9.5px] text-gray-400 text-right max-w-[160px] leading-snug">
                  {!allCriteriaFilledAndValid ? "Cần điền đủ 5 tiêu chí hợp lệ" : (!conclusion?.trim() || !decision) ? "Hoàn thành Kết luận & Kiến nghị" : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmModal totalScore={totalScore} grade={grade} onClose={() => setConfirmOpen(false)} onConfirm={handleSubmit(onSubmit)} submitting={submitting} />
      )}
    </div>
  );
}
