import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { topicsApi } from '../../api/topics.api';
import { minutesApi } from '../../api/minutes.api';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import { getStatusLabel, getStatusColor, formatVND, formatDateTime, getDecisionLabel } from '../../utils/formatters';
import { getAvailableActions } from '../../utils/topicStatusConfig';
import RichTextDisplay from '../../components/ui/RichTextDisplay';
import FocusTrappedModal from '../../components/ui/FocusTrappedModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// ─── SVG Factory ───────────────────────────────────────────────────────────────

const Svg = ({ d, cls = "w-5 h-5", sw = 2 }) => (
  <svg aria-hidden="true" className={`flex-shrink-0 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {[].concat(d).map((p, i) => (
      <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />
    ))}
  </svg>
);

const IcTopic    = p => <Svg {...p} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
const IcEdit     = p => <Svg {...p} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />;
const IcX        = p => <Svg {...p} d="M6 18L18 6M6 6l12 12" />;
const IcLeft     = p => <Svg {...p} d="M11 17l-5-5m0 0l5-5m-5 5h12" />;
const IcDoc      = p => <Svg {...p} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />;
const IcDownload = p => <Svg {...p} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />;
const IcWarning  = p => <Svg {...p} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />;
const IcUsers    = p => <Svg {...p} d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 4a3 3 0 10-6 0" />;
const IcCash     = p => <Svg {...p} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />;
const IcInfo     = p => <Svg {...p} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
const IcCheck    = p => <Svg {...p} d="M5 13l4 4L19 7" />;
const IcLoader   = p => <Svg {...p} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />;
const IcAction   = p => <Svg {...p} d="M13 10V3L4 14h7v7l9-11h-7z" />;
const IcClock    = p => <Svg {...p} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;

// ─── Configurations & FSM ──────────────────────────────────────────────────────

const RESEARCH_TYPE_LABELS = {
  BASIC: 'Nghiên cứu cơ bản',
  APPLIED: 'Nghiên cứu ứng dụng',
  EXPERIMENTAL: 'Triển khai thực nghiệm',
};

const FSM_STAGES = [
  { label: 'Khởi tạo', statuses: ['DRAFT'] },
  { label: 'Khoa duyệt', statuses: ['PENDING_REVIEW', 'DEPT_APPROVED', 'DEPT_REJECTED'] },
  { label: 'QLKH duyệt', statuses: ['PENDING_COUNCIL'] },
  { label: 'Hội đồng đánh giá', statuses: ['COUNCIL_REVIEWED', 'REVISION_REQUIRED'] },
  { label: 'Kết luận', statuses: ['APPROVED', 'REJECTED'] },
];

function getActiveStageIndex(topicStatus) {
  const idx = FSM_STAGES.findIndex((s) => s.statuses.includes(topicStatus));
  return idx >= 0 ? idx : 0;
}

// ─── Modal Overlay ─────────────────────────────────────────────────────────────

const ModalOverlay = ({ onClose, children }) => (
  <FocusTrappedModal onClose={onClose}>
    {children}
  </FocusTrappedModal>
);

// ─── UI Components ────────────────────────────────────────────────────────────

const SectionCard = ({ title, icon, children, accentColor }) => (
  <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${accentColor ? `border-l-4 border-l-${accentColor} border-t border-r border-b border-gray-100` : "border border-gray-100"}`}>
    <div className="flex items-center gap-2.5 px-6 py-3.5 border-b border-gray-100 bg-gray-50/60">
      <span className="text-[#1a5ea8]">{icon}</span>
      <h3 className="text-sm font-bold text-gray-700">{title}</h3>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

const ContentSection = ({ title, subtitle, html }) => {
  if (!html || html === '<p></p>') return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-6 py-5 prose prose-sm max-w-none text-gray-700 leading-relaxed">
        <RichTextDisplay html={html} />
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, full = false }) => (
  <div className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm text-gray-800 leading-snug">{value || "—"}</span>
  </div>
);

// ─── Modals ────────────────────────────────────────────────────────────────────

const CouncilMinutesModal = ({ minute, onClose }) => {
  if (!minute) return null;
  const avgScore = minute.averageScore?.toFixed(2) ?? '—';
  const decisionLabel = getDecisionLabel(minute.finalDecision);

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-purple-50 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Biên bản Hội đồng Đánh giá</h2>
            <p className="text-xs text-gray-500 mt-0.5">Ngày lập: {formatDateTime(minute.createdAt)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-purple-100 transition">
            <IcX cls="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hội đồng</span>
              <span className="text-sm text-gray-800 font-bold leading-snug">{minute.councilName || '—'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Điểm trung bình</span>
              <span className="text-lg font-black text-[#1a5ea8] leading-snug">{avgScore}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nhận xét tổng quan & Giải trình</p>
            <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 whitespace-pre-wrap font-mono">
              {minute.synthesizedComments || <span className="italic text-gray-400">Không có dữ liệu tổng hợp.</span>}
            </div>
          </div>

          <div className={`rounded-xl border px-5 py-4 flex flex-col gap-2 ${minute.finalDecision === 'REVISION_REQUIRED' || minute.finalDecision === 'REJECTED' ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Kết luận của Hội đồng</span>
              <span className={`ml-auto text-xs font-black px-3 py-1 rounded-full ${minute.finalDecision === 'REVISION_REQUIRED' || minute.finalDecision === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {decisionLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-100 flex-shrink-0 bg-gray-50">
          <button onClick={onClose} className="h-9 px-6 rounded-lg bg-[#1a5ea8] hover:bg-[#15306a] text-white text-sm font-bold transition shadow-sm">Đóng</button>
        </div>
      </div>
    </ModalOverlay>
  );
};

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function TopicDetailPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  const role = useAuthStore((s) => s.getRole());

  const [topic, setTopic] = useState(null);
  const [minute, setMinute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [minutesModalOpen, setMinutesModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await topicsApi.getById(topicId);
        setTopic(res.data);
        if (['COUNCIL_REVIEWED', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED'].includes(res.data?.topicStatus)) {
          try {
            const minRes = await minutesApi.getByTopicId(topicId);
            setMinute(minRes.data);
          } catch { /* no minute yet */ }
        }
      } catch { /* interceptor */ }
      finally { setLoading(false); }
    };
    load();
  }, [topicId]);

  const handleAction = async (targetStatus) => {
    setActionLoading(true);
    try {
      await topicsApi.changeStatus(topicId, { targetStatus });
      addToast({ type: 'success', message: 'Cập nhật trạng thái thành công.' });
      const res = await topicsApi.getById(topicId);
      setTopic(res.data);
    } catch { /* interceptor */ }
    finally { setActionLoading(false); }
  };

  const handleDownload = async (attachmentId) => {
    try {
      const res = await topicsApi.downloadAttachment(topicId, attachmentId);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attachment_${topicId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* interceptor */ }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 h-screen">
        <LoadingSpinner
          label="Đang tải hồ sơ đề tài"
          sizeClass="h-10 w-10"
          borderClass="border-2 border-[#1a5ea8] border-t-transparent"
        />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="text-center py-24 h-screen flex flex-col items-center justify-center">
        <div className="text-gray-300 text-6xl mb-4 font-black">404</div>
        <p className="text-gray-500 font-medium">Không tìm thấy hồ sơ đề tài.</p>
        <button onClick={() => navigate('/researcher/dashboard')} className="mt-4 text-[#1a5ea8] font-bold hover:underline">Về Dashboard</button>
      </div>
    );
  }

  const actions = getAvailableActions(topic.topicStatus, role);
  const canEdit = topic.topicStatus === 'DEPT_REJECTED' || topic.topicStatus === 'REVISION_REQUIRED' || topic.topicStatus === 'DRAFT';
  const hasRichContent = topic.urgencyStatement || topic.generalObjective || topic.specificObjectives || topic.researchApproach || topic.researchMethods || topic.researchScope;
  const hasProducts = topic.expectedProductsType1 || topic.expectedProductsType2 || topic.trainingPlan || topic.budgetExplanation;

  const tabs = [
    { id: 'overview', label: 'Tổng quan' },
    ...(hasRichContent ? [{ id: 'content', label: 'Nội dung nghiên cứu' }] : []),
    ...(hasProducts ? [{ id: 'products', label: 'Sản phẩm & Kinh phí' }] : []),
    ...(topic.auditLogs?.length > 0 ? [{ id: 'history', label: 'Lịch sử & Phản hồi' }] : []),
  ];

  const currentIdx = getActiveStageIndex(topic.topicStatus);
  const isRejected = topic.topicStatus === 'REJECTED' || topic.topicStatus === 'DEPT_REJECTED';

  return (
    <div className="max-w-5xl mx-auto pb-12 pt-6">
      
      {/* ── Page Header ── */}
      <header className="bg-white border border-gray-200 rounded-2xl shadow-sm px-8 py-6 mb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => navigate('/researcher/dashboard')} className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#1a5ea8] transition">
                <IcLeft cls="w-3.5 h-3.5" /> Dashboard
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-xs font-bold text-[#1a5ea8] tracking-widest">{topic.topicCode}</span>
            </div>
            <h1 className="text-xl font-black text-gray-900 leading-snug line-clamp-2">
              {topic.titleVn}
            </h1>
          </div>

          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${getStatusColor(topic.topicStatus)}`}>
              {getStatusLabel(topic.topicStatus)}
            </span>
            
            {/* [CẬP NHẬT LOGIC NÚT]: Hiển thị rõ ràng cho Chủ nhiệm biết cần phải sửa */}
            {canEdit && (
              <Link to={`/researcher/topics/${topicId}/revise`} className="flex items-center gap-2 h-9 px-5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold transition shadow-sm animate-pulse">
                <IcEdit cls="w-4 h-4" /> Bổ sung / Cập nhật hồ sơ
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Progress Stepper ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-8 py-6 mb-6">
        <div className="flex items-start max-w-4xl mx-auto">
          {FSM_STAGES.map((stage, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={stage.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center flex-shrink-0 relative">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2 ${
                    done ? "bg-green-500 border-green-500 text-white" :
                    active && isRejected ? "bg-red-500 border-red-500 text-white" :
                    active ? "bg-[#1a5ea8] border-[#1a5ea8] text-white ring-4 ring-[#1a5ea8]/20" :
                    "bg-white border-gray-200 text-gray-400"
                  }`}>
                    {done ? <IcCheck cls="w-5 h-5" /> : idx + 1}
                  </div>
                  <span className={`absolute top-11 text-[11px] font-bold text-center leading-snug whitespace-nowrap ${
                    done ? "text-green-600" : active && isRejected ? "text-red-600" : active ? "text-[#1a5ea8]" : "text-gray-400"
                  }`}>
                    {stage.label}
                  </span>
                </div>
                {idx < FSM_STAGES.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 -mt-6 rounded-full ${idx < currentIdx ? "bg-green-400" : "bg-gray-100"}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="h-6" /> {/* Spacer for absolute text */}
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${
            activeTab === tab.id ? "bg-[#1a5ea8] text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-800"
          }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="space-y-6">
        
        {activeTab === 'overview' && (
          <>
            <SectionCard title="Thông tin chung" icon={<IcInfo cls="w-4 h-4" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <InfoRow label="Tên đề tài (Tiếng Anh)" value={topic.titleEn} full />
                <InfoRow label="Lĩnh vực Khoa học" value={topic.researchField} />
                <InfoRow label="Loại hình nghiên cứu" value={RESEARCH_TYPE_LABELS[topic.researchType] ?? topic.researchType} />
                <InfoRow label="Đơn vị quản lý" value={topic.managingDepartmentName} />
                <InfoRow label="Thời gian thực hiện" value={`${topic.durationMonths} tháng`} />

                <div className="col-span-1 md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Thành viên tham gia</span>
                  {topic.members && topic.members.length > 0 ? (
                    <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                      {topic.members.map((m, index) => (
                        <li key={m.id || index}><span className="font-semibold">{m.memberName}</span></li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-gray-500 italic">Không có thành viên tham gia phụ. Chủ nhiệm thực hiện độc lập.</span>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Nhân sự & Kinh phí" icon={<IcUsers cls="w-4 h-4" />}>
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Chủ nhiệm đề tài</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-blue-50/40 rounded-xl p-4 border border-blue-100">
                    <InfoRow label="Họ và tên" value={topic.investigatorFullName} />
                    <InfoRow label="Email liên hệ" value={topic.investigatorEmail} />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-green-50 rounded-xl px-5 py-4 border border-green-200">
                  <div className="flex items-center gap-2">
                    <IcCash cls="w-5 h-5 text-green-600" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Dự toán kinh phí tổng thể</span>
                  </div>
                  <span className="text-xl font-black text-green-700">{formatVND(topic.expectedBudget)}</span>
                </div>
              </div>
            </SectionCard>

            {topic.attachments?.length > 0 && (
              <SectionCard title="Tài liệu đính kèm" icon={<IcDownload cls="w-4 h-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topic.attachments.map((att) => (
                    <div key={att.attachmentId} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md hover:border-blue-200 transition group">
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-black flex-shrink-0">PDF</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">Thuyết minh đề tài V{att.fileVersion}</p>
                        <p className="text-[10px] font-medium text-gray-400 mt-0.5">{formatDateTime(att.uploadedAt)}</p>
                      </div>
                      <button onClick={() => handleDownload(att.attachmentId)} className="flex items-center gap-1.5 text-xs font-bold text-[#1a5ea8] bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:border-blue-300 transition opacity-80 group-hover:opacity-100 shadow-sm">
                        <IcDownload cls="w-3.5 h-3.5" /> Tải về
                      </button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Quick Actions Card for state progression */}
            {actions.length > 0 && (
              <SectionCard title="Thao tác xét duyệt" icon={<IcAction cls="w-4 h-4" />} accentColor="blue-500">
                <div className="flex flex-wrap gap-3">
                  {actions.map((a) => (
                    <button key={a.targetStatus} onClick={() => handleAction(a.targetStatus)} disabled={actionLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-[#1a5ea8] rounded-lg hover:bg-[#15306a] shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
                      {actionLoading && <IcLoader cls="w-4 h-4 animate-spin" />}
                      {a.label}
                    </button>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        )}

        {activeTab === 'content' && (
          <div className="flex flex-col gap-6">
            <ContentSection title="Tính cấp thiết của đề tài" html={topic.urgencyStatement} />
            <ContentSection title="Mục tiêu tổng quát" html={topic.generalObjective} />
            <ContentSection title="Mục tiêu cụ thể" html={topic.specificObjectives} />
            <ContentSection title="Cách tiếp cận nghiên cứu" html={topic.researchApproach} />
            <ContentSection title="Phương pháp nghiên cứu" html={topic.researchMethods} />
            <ContentSection title="Phạm vi nghiên cứu" html={topic.researchScope} />
            <ContentSection title="Kế hoạch triển khai" html={topic.implementationPlan} />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="flex flex-col gap-6">
            <ContentSection title="Sản phẩm khoa học Dạng I" subtitle="Bài báo, sách chuyên khảo, báo cáo khoa học" html={topic.expectedProductsType1} />
            <ContentSection title="Sản phẩm khoa học Dạng II" subtitle="Sáng chế, giải pháp hữu ích, phần mềm, quy trình" html={topic.expectedProductsType2} />
            <ContentSection title="Kế hoạch đào tạo" subtitle="Thạc sĩ, Tiến sĩ, Sinh viên NCKH" html={topic.trainingPlan} />
            <ContentSection title="Chi tiết phân bổ Kinh phí" html={topic.budgetExplanation} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="relative flex flex-col gap-2 pt-2 ml-4">
            {/* Timeline Line */}
            <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-gray-100" />
            
            {topic.auditLogs?.map((log, idx) => (
              <div key={log.id ?? idx} className="relative flex gap-6 pb-6">
                <div className="relative z-10 w-10 h-10 rounded-full bg-white border-4 border-gray-50 flex items-center justify-center text-[10px] font-black text-gray-500 shadow-sm flex-shrink-0 mt-1">
                  {idx + 1}
                </div>
                <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-blue-100 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-bold text-gray-800">{log.actorFullName}</span>
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{log.actorRole}</span>
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1"><IcClock cls="w-3 h-3" /> {formatDateTime(log.actionTimestamp)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap mb-3 bg-gray-50/50 p-2 rounded-lg border border-gray-100 inline-flex">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getStatusColor(log.previousStatus)}`}>{getStatusLabel(log.previousStatus)}</span>
                    <span className="text-gray-300">→</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getStatusColor(log.newStatus)}`}>{getStatusLabel(log.newStatus)}</span>
                  </div>

                  {log.feedbackNote && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[12.5px] text-amber-800 leading-relaxed font-medium">
                      <p className="flex items-start gap-1.5"><IcWarning cls="w-4 h-4 mt-0.5 text-amber-500" /> {log.feedbackNote}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Injected Council Minute Card if available */}
            {minute && (
              <div className="relative flex gap-6 pb-6">
                <div className="relative z-10 w-10 h-10 rounded-full bg-purple-100 border-4 border-white flex items-center justify-center shadow-sm flex-shrink-0 mt-1">
                  <IcDoc cls="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 rounded-xl p-4 bg-purple-50 border border-purple-200 shadow-sm hover:shadow-md transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-purple-900">Biên bản Hội đồng Đánh giá</p>
                      <p className="text-[11px] text-purple-600 mt-1 font-medium">Hội đồng: {minute.councilName}</p>
                    </div>
                    <button onClick={() => setMinutesModalOpen(true)} className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm">
                      <IcTopic cls="w-3.5 h-3.5" /> Xem chi tiết Biên bản
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {minutesModalOpen && <CouncilMinutesModal minute={minute} onClose={() => setMinutesModalOpen(false)} />}
    </div>
  );
}