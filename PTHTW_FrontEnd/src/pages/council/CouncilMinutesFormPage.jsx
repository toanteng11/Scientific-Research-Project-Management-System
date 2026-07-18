// File: src/pages/council/CouncilMinutesFormPage.jsx

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { minutesApi } from '../../api/minutes.api';
import { councilsApi } from '../../api/councils.api';
import { topicsApi } from '../../api/topics.api';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import FocusTrappedModal from '../../components/ui/FocusTrappedModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ForbiddenPage from '../../components/error/ForbiddenPage';
import { getDecisionLabel, getCouncilRoleLabel } from '../../utils/formatters';
import logoOU from '../../assets/ADMIN/logo-ou.svg';

const POLL_INTERVAL = 30000;

// ─── Schema Validation ────────────────────────────────────────────────────────

const schema = yup.object({
  synthesizedComments: yup.string().required('Bắt buộc nhập tổng hợp ý kiến').min(100, 'Tối thiểu 100 ký tự'),
  qaExplanations: yup.string(),
  finalDecision: yup.string().required('Bắt buộc chọn kết luận').oneOf(['APPROVED', 'REVISION_REQUIRED', 'REJECTED']),
});

// ─── Configurations & Theming ─────────────────────────────────────────────────

const ROLE_CFG = {
  PRESIDENT:  { avatarGrad: "from-red-600 to-red-800", pill: "bg-red-50 text-red-700 border-red-200" },
  SECRETARY:  { avatarGrad: "from-indigo-600 to-indigo-800", pill: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  REVIEWER_1: { avatarGrad: "from-orange-500 to-orange-700", pill: "bg-orange-50 text-orange-700 border-orange-200" },
  REVIEWER_2: { avatarGrad: "from-amber-500 to-amber-700", pill: "bg-amber-50 text-amber-700 border-amber-200" },
  MEMBER:     { avatarGrad: "from-gray-500 to-gray-700", pill: "bg-gray-50 text-gray-700 border-gray-200" },
};

// Default fallback for generic roles
const getRoleCfg = (roleCode) => ROLE_CFG[roleCode] || ROLE_CFG.MEMBER;

const DECISION_CONFIG = [
  { id: "APPROVED", title: "Thông qua", subtitle: "Đạt, có thể cần chỉnh sửa nhỏ", 
    accent: { border: "border-green-500", bg: "bg-green-50", ring: "ring-green-500/20", text: "text-green-700", sub: "text-green-600", badge: "bg-green-500 text-white", iconBg: "bg-green-100 text-green-600" } 
  },
  { id: "REVISION_REQUIRED", title: "Yêu cầu chỉnh sửa", subtitle: "Chỉnh sửa lớn, đánh giá lại", 
    accent: { border: "border-amber-500", bg: "bg-amber-50", ring: "ring-amber-500/20", text: "text-amber-700", sub: "text-amber-600", badge: "bg-amber-500 text-white", iconBg: "bg-amber-100 text-amber-600" } 
  },
  { id: "REJECTED", title: "Không thông qua", subtitle: "Hủy đề tài", 
    accent: { border: "border-red-500", bg: "bg-red-50", ring: "ring-red-500/20", text: "text-red-700", sub: "text-red-600", badge: "bg-red-500 text-white", iconBg: "bg-red-100 text-red-600" } 
  }
];

// ─── SVG Factory ────────────────────────────────────────────────────────────────

const Svg = ({ d, cls = "w-5 h-5", sw = 2, fill = "none" }) => (
  <svg aria-hidden="true" className={`flex-shrink-0 ${cls}`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {[].concat(d).map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)}
  </svg>
);

const IcLeft     = p => <Svg {...p} d="M10 19l-7-7m0 0l7-7m-7 7h18" />;
const IcDoc      = p => <Svg {...p} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />;
const IcChat     = p => <Svg {...p} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />;
const IcSparkle  = p => <Svg {...p} d="M5 3v4M3 5h4M6.343 6.343l2.829 2.829M3 12h4m-4 4h4m.343-4.343l2.829 2.829M12 3v4m4-4v4m4-4v4m-4 4h4m-4 4h4m-4-8l2.829 2.829M12 17v4m4-4v4m4-4v4" />;
const IcCheck    = p => <Svg {...p} d="M5 13l4 4L19 7" />;
const IcX        = p => <Svg {...p} d="M6 18L18 6M6 6l12 12" />;
const IcAlert    = p => <Svg {...p} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />;
const IcEdit     = p => <Svg {...p} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />;
const IcLoader   = p => <Svg {...p} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />;
const IcUsers    = p => <Svg {...p} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />;
const IcStar     = p => <Svg {...p} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />;
const IcPublish  = p => <Svg {...p} d={["M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"]} />;
const IcInfo     = p => <Svg {...p} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;

const DECISION_OPTIONS = [
  { ...DECISION_CONFIG[0], icon: <IcCheck cls="w-6 h-6" /> },
  { ...DECISION_CONFIG[1], icon: <IcEdit cls="w-6 h-6" /> },
  { ...DECISION_CONFIG[2], icon: <IcX cls="w-6 h-6" /> },
];

// ─── Components ───────────────────────────────────────────────────────────────

const ConfirmModal = ({ decision, avgScore, onClose, onConfirm, submitting }) => {
  const [legalChecked, setLegalChecked] = useState(false);
  const opt = DECISION_OPTIONS.find(o => o.id === decision);

  return (
    <FocusTrappedModal onClose={onClose} dismissible={!submitting}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
              <IcAlert cls="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 leading-tight">Xác nhận Công bố Biên bản</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Hành động không thể hoàn tác</p>
            </div>
          </div>
          {!submitting && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition">
              <IcX cls="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-[12.5px] text-amber-800 leading-relaxed font-medium">
              Sau khi công bố, Biên bản Hội đồng sẽ được ghi nhận chính thức vào hệ thống và gửi thông báo đến Chủ nhiệm đề tài. <strong>Bạn sẽ không thể hoàn tác hành động này.</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Điểm Trung bình</p>
              <p className="text-2xl font-black text-[#1a5ea8]">{avgScore != null ? Number(avgScore).toFixed(2) : '—'}<span className="text-sm font-semibold text-gray-400">/100</span></p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="flex-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Kết luận</p>
              {opt && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${opt.accent.border} ${opt.accent.bg} ${opt.accent.text}`}>
                  {opt.icon}
                  {opt.title}
                </span>
              )}
            </div>
          </div>

          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition select-none ${
            legalChecked ? "border-[#1a5ea8] bg-blue-50" : "border-gray-200 bg-white hover:border-blue-300"
          }`}>
            <div className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0 border-2 transition ${
              legalChecked ? "bg-[#1a5ea8] border-[#1a5ea8]" : "border-gray-300 bg-white"
            }`}>
              {legalChecked && <IcCheck cls="w-3 h-3 text-white" />}
            </div>
            <input type="checkbox" className="sr-only" checked={legalChecked} onChange={e => !submitting && setLegalChecked(e.target.checked)} />
            <p className={`text-[12.5px] leading-relaxed font-medium ${legalChecked ? "text-[#1a5ea8]" : "text-gray-600"}`}>
              Tôi xác nhận nội dung biên bản đã phản ánh <strong>trung thực kết quả</strong> của phiên họp Hội đồng và có đầy đủ căn cứ để công bố chính thức.
            </p>
          </label>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button disabled={submitting} onClick={onClose} className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            Hủy bỏ
          </button>
          <button
            disabled={!legalChecked || submitting}
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition ${
              legalChecked && !submitting
                ? "bg-[#1a5ea8] hover:bg-[#15306a] text-white shadow-sm"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {submitting ? <><IcLoader cls="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><IcPublish cls="w-4 h-4" /> Xác nhận & Công bố</>}
          </button>
        </div>
      </div>
    </FocusTrappedModal>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

export default function CouncilMinutesFormPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userClaims?.userId);
  const addToast = useUiStore((s) => s.addToast);

  // States
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [topic, setTopic] = useState(null);
  const [councilId, setCouncilId] = useState(null);
  const [councilDetail, setCouncilDetail] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [averageScore, setAverageScore] = useState(null);
  const [topicCouncilRole, setTopicCouncilRole] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [hasDraftMinute, setHasDraftMinute] = useState(false);
  const [tab, setTab] = useState("thuyetminh");
  
  const pollRef = useRef(null);

  // Hook Form
  const { register, setValue, watch, formState: { errors, isValid } } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: { synthesizedComments: '', qaExplanations: '', finalDecision: '' },
  });

  const minutesText = watch('synthesizedComments');
  const decision = watch('finalDecision');
  const qaText = watch('qaExplanations');

  const hasDecision = Boolean(decision && decision !== 'PENDING');

  // ── ABAC Guard & Init Load ──
  useEffect(() => {
    const verify = async () => {
      try {
        const myTopicsList = await councilsApi.fetchAllMyCouncilTopics();
        const assignment = myTopicsList.find((t) => String(t.topicId) === String(topicId));

        if (!assignment) {
          setForbidden(true);
          setLoading(false);
          return;
        }

        // Workspace Segregation: Chủ tịch phê duyệt Biên bản trong Phòng làm việc riêng.
        if (assignment.councilRole === 'PRESIDENT') {
          navigate(`/council/topics/${topicId}/president`, { replace: true });
          return;
        }

        setTopicCouncilRole(assignment.councilRole);
        setCouncilId(assignment.councilId);

        const [topicRes] = await Promise.all([topicsApi.getById(topicId)]);
        setTopic(topicRes.data);

        if (assignment.councilId) {
          const [councilRes] = await Promise.all([councilsApi.getById(assignment.councilId)]);
          setCouncilDetail(councilRes.data);
        }

        try {
           const minRes = await minutesApi.getByTopicId(topicId);
           if (minRes.data) {
              setValue('synthesizedComments', minRes.data.synthesizedComments);
              setValue('qaExplanations', minRes.data.qaExplanations || '');
              setValue('finalDecision', minRes.data.finalDecision === 'PENDING' ? '' : minRes.data.finalDecision);
              setAverageScore(minRes.data.averageScore);
              setHasDraftMinute(true);
              setSubmitted(minRes.data.finalDecision && minRes.data.finalDecision !== 'PENDING');
           }
        } catch {
           if (assignment.councilRole !== 'SECRETARY' && assignment.councilRole !== 'PRESIDENT') {
              setForbidden(true);
           }
        }
      } catch {
        setForbidden(true);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [topicId, userId, setValue, navigate]);

  // ── Polling Readiness ──
  const fetchReadiness = useCallback(async () => {
    if (!councilId) return;
    try {
      const res = await councilsApi.getEvaluationStatus(councilId, topicId);
      setReadiness(res.data);
      if (res.data?.ready) {
        const avgRes = await topicsApi.getAverageScore(topicId);
        setAverageScore(avgRes.data);
      }
    } catch { /* silent */ }
  }, [councilId, topicId]);

  useEffect(() => {
    if (!councilId) return;
    fetchReadiness();
    pollRef.current = setInterval(fetchReadiness, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [councilId, fetchReadiness]);

  useEffect(() => {
    if (!justSubmitted) return undefined;
    const t = setTimeout(() => navigate('/council/dashboard'), 4000);
    return () => clearTimeout(t);
  }, [justSubmitted, navigate]);

  const handleAutoExtract = () => {
    if (!readiness?.evaluations) return;
    const extracted = readiness.evaluations
      .map(e => `[${getCouncilRoleLabel(e.councilRole)} - ${e.evaluatorFullName}]: ${e.generalComment || "Không có ý kiến cụ thể."}`)
      .join('\n\n');
    setValue('synthesizedComments', "--- TỔNG HỢP Ý KIẾN THÀNH VIÊN ---\n" + extracted, { shouldValidate: true });
  };

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      let comments = minutesText;
      if (qaText?.trim()) {
        comments += '\n\n--- GIẢI TRÌNH CỦA CHỦ NHIỆM ---\n\n' + qaText;
      }

      // Workspace Segregation: Thư ký chỉ có quyền LƯU NHÁP biên bản.
      // Phê duyệt/Công bố (kích hoạt FSM) thuộc quyền Chủ tịch tại Phòng làm việc riêng.
      await minutesApi.draft({
        topicId: Number(topicId),
        synthesizedComments: comments,
        finalDecision: null,
        legalConfirmation: null,
      });

      setConfirmOpen(false);
      setHasDraftMinute(true);
      setJustSubmitted(true); // <-- Đã cập nhật dòng này để sửa lỗi ESLint
      addToast({
        type: 'success',
        message: 'Đã lưu nháp biên bản và chuyển Chủ tịch phê duyệt.',
        duration: 4000,
      });
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmOpen(false);
        addToast({
          type: 'error',
          message: 'Lỗi: Biên bản cho đề tài này đã tồn tại.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <LoadingSpinner label="Đang tải biên bản" sizeClass="h-8 w-8" borderClass="border-b-2 border-[#1a5ea8]" />
      </div>
    );
  }
  if (forbidden) return <ForbiddenPage />;

  const isReady = readiness?.ready === true;
  const evaluations = readiness?.evaluations || [];
  const isSecretary = topicCouncilRole === 'SECRETARY';
  const isPresident = topicCouncilRole === 'PRESIDENT';
  const canSaveDraft = isSecretary && isReady && minutesText.trim().length > 0 && !submitted;
  const canApprove = isPresident && isReady && hasDraftMinute && minutesText.trim().length > 0 && hasDecision && !submitted;

  // Helper for scoring grade UI
  const getScoreGrade = (score) => {
    if (score == null) return { bg: "bg-gray-100", text: "text-gray-500", label: "Chưa có" };
    if (score >= 85) return { bg: "bg-green-100", text: "text-green-700", label: "TỐT / XUẤT SẮC" };
    if (score >= 70) return { bg: "bg-blue-100", text: "text-blue-700", label: "KHÁ / ĐẠT" };
    return { bg: "bg-red-100", text: "text-red-700", label: "KHÔNG ĐẠT" };
  };

  const grade = getScoreGrade(averageScore);
  const pct = averageScore ? Math.round((averageScore / 100) * 100) : 0;
  const minScore = evaluations.length > 0 ? Math.min(...evaluations.map(e => e.totalScore || 0)) : 0;
  const maxScore = evaluations.length > 0 ? Math.max(...evaluations.map(e => e.totalScore || 0)) : 0;
  const isReadOnly = submitted || (!isSecretary && !isPresident);

  return (
    // Replaced h-screen w-screen with AppShell compatible wrapper
    <div className="-m-6 flex flex-col h-[calc(100vh-4rem)] bg-[#eaf5fc] border-l border-gray-200">
      
      {/* ── Global Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm px-6 py-3.5 flex items-center gap-4 flex-shrink-0 z-10">
        <Link to="/council/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#1a5ea8] transition px-3 py-1.5 rounded-lg hover:bg-blue-50 flex-shrink-0">
          <IcLeft cls="w-4 h-4" />
          Về Dashboard
        </Link>
        <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img src={logoOU} alt="OU" className="h-8 w-auto object-contain flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Biên bản điện tử (SC-COUNCIL-04)</p>
            <h1 className="text-sm font-bold text-gray-800 truncate leading-tight">
              Họp Hội đồng Xét duyệt — <span className="text-[#1a5ea8]">{topic?.topicCode}</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full hidden sm:inline-flex items-center gap-1.5">
            <IcUsers cls="w-3 h-3" />
            {evaluations.length}/{readiness?.totalNonSecretaries || 0} phiếu đánh giá
          </span>
          {submitted ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
              <IcCheck cls="w-3.5 h-3.5" />
              Đã Công bố
            </span>
          ) : !isReady && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full animate-pulse">
              <IcLoader cls="w-3.5 h-3.5 animate-spin" />
              Đang chờ phiếu...
            </span>
          )}
        </div>
      </header>

      {/* ── Main split area ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── Left Panel ── */}
        <div className="flex flex-col w-[35%] min-w-[320px] flex-shrink-0 bg-[#F4F5F7] border-r border-gray-200 overflow-hidden relative shadow-sm z-10">
          <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
            {[
              { id: "thuyetminh", label: "Thông tin Đề tài", icon: <IcDoc cls="w-4 h-4" /> },
              { id: "yKien",      label: "Ý kiến Đánh giá",  icon: <IcChat cls="w-4 h-4" /> },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold transition border-b-2 ${tab === t.id ? "border-[#1a5ea8] text-[#1a5ea8] bg-[#eaf5fc]" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                {t.icon}
                {t.label}
                {t.id === "yKien" && <span className="ml-1 w-5 h-5 rounded-full bg-[#c5e2f5] text-[#1a5ea8] text-[9px] font-black flex items-center justify-center">{evaluations.length}</span>}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === "thuyetminh" ? (
              <div className="p-5 flex flex-col gap-5">
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#c5e2f5] flex items-center justify-center flex-shrink-0 mt-0.5"><IcDoc cls="w-5 h-5 text-[#1a5ea8]" /></div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-[#1a5ea8] uppercase tracking-wider">{topic?.topicCode}</span>
                      <p className="text-[12.5px] font-bold text-gray-900 leading-tight mt-0.5">{topic?.titleVn}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-3">
                    <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Chủ nhiệm</p><p className="text-[11.5px] font-semibold text-gray-700 leading-snug mt-0.5">{topic?.investigatorFullName}</p></div>
                    <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Đơn vị</p><p className="text-[11.5px] font-semibold text-gray-700 leading-snug mt-0.5">{topic?.managingDepartmentName}</p></div>
                    <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Thời gian</p><p className="text-[11.5px] font-semibold text-gray-700 leading-snug mt-0.5">{topic?.durationMonths} tháng</p></div>
                  </div>
                </div>
                {topic?.titleEn && (
                  <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tên tiếng Anh</p><p className="text-[12px] text-gray-600 font-medium leading-relaxed">{topic.titleEn}</p></div>
                )}
                {councilDetail && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Hội đồng phụ trách</p>
                    <p className="text-[12px] text-blue-800 font-bold">{councilDetail.councilName}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {evaluations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">Chưa có phiếu đánh giá nào được nộp.</div>
                ) : (
                  evaluations.map((ev, idx) => {
                    const cfg = getRoleCfg(ev.councilRole);
                    const ePct = Math.round((ev.totalScore / 100) * 100);
                    const eBar = ev.totalScore >= 85 ? "bg-green-500" : ev.totalScore >= 70 ? "bg-blue-500" : "bg-red-500";
                    
                    return (
                      <div key={idx} className="p-4 hover:bg-white/60 transition">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${cfg.avatarGrad} flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold shadow-sm`}>
                            {ev.evaluatorFullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-[12.5px] font-bold text-gray-800 leading-tight truncate">{ev.evaluatorFullName}</p>
                              <div className="flex items-center gap-1.5">
                                <IcStar cls="w-3 h-3 text-amber-400" fill="currentColor" />
                                <span className="text-[13px] font-black text-gray-700">{ev.totalScore?.toFixed(2) ?? '—'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${cfg.pill}`}>
                                {getCouncilRoleLabel(ev.councilRole)}
                              </span>
                              <span className="text-[10px] text-gray-500 font-medium italic">
                                Kiến nghị: {getDecisionLabel(ev.recommendedDecision)}
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${eBar}`} style={{ width: `${ePct}%` }} />
                            </div>
                            <p className="text-[11.5px] text-gray-600 leading-relaxed mt-2 p-2 bg-white rounded border border-gray-100 shadow-sm whitespace-pre-wrap">
                              {ev.generalComment || <span className="italic text-gray-400">Không có nhận xét cụ thể</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel (Form) ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-white">
          <div className={`flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-8 transition-opacity ${!isReady ? 'opacity-60 pointer-events-none select-none' : ''}`}>
            
            {/* Section 1: Score Summary */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#c5e2f5] flex items-center justify-center text-[#1a5ea8] text-[11px] font-black">1</span>
                <h2 className="text-[14px] font-bold text-gray-800">Tổng hợp Điểm đánh giá <span className="text-xs text-gray-400 font-medium ml-1">(Từ hệ thống)</span></h2>
              </div>
              <div className="flex gap-5 items-stretch">
                <div className="flex-1 min-w-0 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2.5 px-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Thành viên</th>
                        <th className="py-2.5 px-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vai trò</th>
                        <th className="py-2.5 px-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Điểm số</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluations.map((ev, i) => {
                        const cfg = getRoleCfg(ev.councilRole);
                        return (
                          <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                            <td className="py-2.5 px-4"><span className="text-[12px] font-semibold text-gray-700 truncate">{ev.evaluatorFullName}</span></td>
                            <td className="py-2.5 px-3 text-center"><span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${cfg.pill}`}>{getCouncilRoleLabel(ev.councilRole)}</span></td>
                            <td className="py-2.5 px-4 text-right font-black text-gray-800">{ev.totalScore?.toFixed(2) ?? '—'}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-blue-50/60 border-t border-blue-100">
                        <td colSpan={2} className="py-3 px-4 text-[11.5px] font-bold text-[#1a5ea8] uppercase tracking-wide">Điểm Trung bình Hội đồng</td>
                        <td className="py-3 px-4 text-right"><span className="text-[14px] font-black text-[#1a5ea8]">{averageScore != null ? Number(averageScore).toFixed(2) : '—'}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="w-36 flex-shrink-0 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm p-4 gap-3">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#1a5ea8" strokeWidth="12" strokeLinecap="round" strokeDasharray={2 * Math.PI * 38} strokeDashoffset={2 * Math.PI * 38 * (1 - pct / 100)} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[18px] font-black text-[#1a5ea8] leading-none">{averageScore != null ? Number(averageScore).toFixed(0) : '0'}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${grade.bg} ${grade.text}`}>{grade.label}</span>
                  <div className="w-full flex flex-col gap-1 text-center border-t border-gray-100 pt-2">
                    <div className="flex justify-between text-[9px] text-gray-400"><span>Min</span><span className="font-bold text-gray-600">{minScore.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[9px] text-gray-400"><span>Max</span><span className="font-bold text-gray-600">{maxScore.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            {/* Section 2: Minutes Content */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#c5e2f5] flex items-center justify-center text-[#1a5ea8] text-[11px] font-black">2</span>
                <h2 className="text-[14px] font-bold text-gray-800">Nội dung Nhận xét & Giải trình</h2>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-[12px] text-gray-500">Tổng hợp ý kiến từ Hội đồng. Bạn có thể trích xuất tự động nội dung phiếu.</p>
              {isSecretary && !submitted && (
                <button type="button" onClick={handleAutoExtract} className="inline-flex items-center gap-2 h-8 px-4 rounded-lg border border-[#1a5ea8] text-[#1a5ea8] hover:bg-blue-50 text-xs font-bold transition">
                  <IcSparkle cls="w-3.5 h-3.5" /> Trích xuất tự động ({evaluations.length} phiếu)
                </button>
                )}
              </div>
              <div>
                <textarea
                  {...register('synthesizedComments')}
                  rows={8}
                  disabled={isReadOnly}
                  placeholder="Nhập nội dung tổng hợp..."
                  aria-invalid={errors.synthesizedComments ? 'true' : 'false'}
                  aria-describedby={errors.synthesizedComments ? 'synthesized-comments-error' : undefined}
                  className={`w-full resize-none rounded-xl border bg-gray-50/40 focus:bg-white focus:ring-2 focus:ring-[#1a5ea8]/20 text-[13px] text-gray-800 px-4 py-3 outline-none transition font-mono ${errors.synthesizedComments ? 'border-red-500' : 'border-gray-200 focus:border-[#1a5ea8]'}`}
                />
                {errors.synthesizedComments && (
                  <p id="synthesized-comments-error" className="text-[11px] text-red-500 mt-1 font-medium" role="alert">
                    {errors.synthesizedComments.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-600 mb-1.5">Giải trình của chủ nhiệm đề tài / Hỏi đáp (Nếu có)</label>
                <textarea {...register('qaExplanations')} disabled={isReadOnly} rows={5} placeholder="Ghi nhận các ý kiến thảo luận thêm..." className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/40 focus:bg-white focus:border-[#1a5ea8] focus:ring-2 focus:ring-[#1a5ea8]/20 text-[13px] text-gray-800 px-4 py-3 outline-none transition font-mono" />
              </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            {/* Section 3: Decision */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#c5e2f5] flex items-center justify-center text-[#1a5ea8] text-[11px] font-black">3</span>
                <h2 className="text-[14px] font-bold text-gray-800">Kết luận của Hội đồng <span className="text-red-500">*</span></h2>
              </div>
              <div
                className="grid grid-cols-3 gap-3"
                role="radiogroup"
                aria-invalid={errors.finalDecision ? 'true' : 'false'}
                aria-describedby={errors.finalDecision ? 'final-decision-error' : undefined}
              >
                {DECISION_CONFIG.map(opt => {
                  const isSelected = decision === opt.id;
                  return (
                    <label key={opt.id} className={`flex flex-col items-center text-center gap-3 p-5 rounded-xl border-2 transition-all duration-200 ${isSelected ? `${opt.accent.border} ${opt.accent.bg} ${opt.accent.ring} shadow-sm` : "border-gray-200 bg-white"} ${!isReadOnly ? "cursor-pointer hover:border-gray-300" : "cursor-default"}`}>
                      <input type="radio" {...register('finalDecision')} disabled={isReadOnly} value={opt.id} className="sr-only" />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${isSelected ? opt.accent.iconBg : "bg-gray-100 text-gray-400"}`}>
                        {opt.id === 'APPROVED' ? <IcCheck cls="w-5 h-5"/> : opt.id === 'REVISION_REQUIRED' ? <IcEdit cls="w-5 h-5"/> : <IcX cls="w-5 h-5"/>}
                      </div>
                      <div>
                        <p className={`text-[12.5px] font-bold leading-tight ${isSelected ? opt.accent.text : "text-gray-700"}`}>{opt.title}</p>
                        <p className={`text-[10px] mt-1 leading-snug ${isSelected ? opt.accent.sub : "text-gray-400"}`}>{opt.subtitle}</p>
                      </div>
                      {isSelected && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${opt.accent.badge}`}>✓ Đã chọn</span>}
                    </label>
                  );
                })}
              </div>
              {errors.finalDecision && (
                <p id="final-decision-error" className="text-[11px] text-red-500 mt-1 font-medium" role="alert">
                  {errors.finalDecision.message}
                </p>
              )}
            </div>
            
            <div className="h-4" />
          </div>

          {/* Sticky Footer */}
          <div className="border-t border-gray-200 bg-white px-8 py-4 flex items-center justify-between gap-4 flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20">
            <div className="flex items-center gap-2 min-w-0">
              {!isReady && !submitted ? (
                <div className="flex items-center gap-2 text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 animate-pulse">
                  <IcLoader cls="w-3.5 h-3.5 flex-shrink-0 animate-spin text-amber-500" /> Vui lòng chờ đủ 100% phiếu đánh giá để lập biên bản
                </div>
              ) : submitted ? (
                <div className="flex items-center gap-2 text-[11.5px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <IcCheck cls="w-3.5 h-3.5 flex-shrink-0 text-green-500" /> Biên bản đã được công bố chính thức
                </div>
              ) : isPresident && !hasDraftMinute ? (
                <div className="flex items-center gap-2 text-[11.5px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                  <IcInfo cls="w-3.5 h-3.5 flex-shrink-0 text-indigo-500" /> Chờ Thư ký nộp nháp biên bản để phê duyệt
                </div>
              ) : ((isSecretary && !canSaveDraft) || (isPresident && !canApprove)) && (
                <div className="flex items-center gap-2 text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <IcInfo cls="w-3.5 h-3.5 flex-shrink-0 text-amber-500" /> Vui lòng nhập đủ nội dung cần thiết trước khi tiếp tục
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button disabled={submitting} onClick={() => navigate('/council/dashboard')} className="h-10 px-5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                {isReadOnly ? "Quay lại" : "Hủy bỏ"}
              </button>
              {(isSecretary || isPresident) && !submitted && (
                <button
                  disabled={submitting || (isSecretary ? !canSaveDraft : !canApprove) || !isValid}
                  onClick={() => setConfirmOpen(true)}
                  className={`flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-bold transition ${(isSecretary ? canSaveDraft : canApprove) && isValid && !submitting ? "bg-[#1a5ea8] hover:bg-[#15306a] text-white shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  <IcPublish cls="w-4 h-4" /> {isSecretary ? "Lưu nháp biên bản" : "Phê duyệt & Công bố"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <ConfirmModal 
          decision={decision} 
          avgScore={averageScore} 
          onClose={() => setConfirmOpen(false)} 
          onConfirm={onSubmit}
          submitting={submitting}
        />
      )}
    </div>
  );
}