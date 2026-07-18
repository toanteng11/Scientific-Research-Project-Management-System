// File: src/pages/council/CouncilMemberDashboardPage.jsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { councilsApi } from '../../api/councils.api';
import useAuthStore from '../../store/authStore';
import { getStatusLabel, getCouncilRoleLabel } from '../../utils/formatters';

// ─── SVG Icons Factory ──────────────────────────────────────────────────────────

const Svg = ({ d, cls = "w-5 h-5", sw = 2 }) => (
  <svg className={`flex-shrink-0 ${cls}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {[].concat(d).map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)}
  </svg>
);

const IcCheck     = p => <Svg {...p} d="M5 13l4 4L19 7" />;
const IcAlert     = p => <Svg {...p} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />;
const IcVideo     = p => <Svg {...p} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />;
const IcDoc       = p => <Svg {...p} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />;
const IcClipboard = p => <Svg {...p} d={["M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2", "M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"]} />;

// ─── Configurations ─────────────────────────────────────────────────────────────

const ROLE_BADGE_CFG = {
  PRESIDENT: "bg-red-600 text-white",
  SECRETARY: "bg-indigo-700 text-white",
  REVIEWER: "bg-orange-500 text-white",
  MEMBER: "bg-gray-600 text-white",
};

const STATUS_BADGE_CFG = {
  PENDING_COUNCIL: { bg: "bg-amber-50 border border-amber-200", text: "text-amber-700", icon: <IcAlert cls="w-3 h-3" /> },
  COMPLETED: { bg: "bg-green-50 border border-green-200", text: "text-green-700", icon: <IcCheck cls="w-3 h-3" /> },
  DEFAULT: { bg: "bg-gray-50 border border-gray-200", text: "text-gray-600", icon: null }
};

const TABS = [
  { key: 'pending', label: 'Sắp diễn ra / Chờ đánh giá' },
  { key: 'completed', label: 'Đã hoàn tất' },
];

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function CouncilMemberDashboardPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [workspace, setWorkspace] = useState('evaluator');
  
  const userClaims = useAuthStore((s) => s.userClaims);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const list = await councilsApi.fetchAllMyCouncilTopics();
      setTopics(list);
    } catch { /* Interceptor handles errors */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  // ─── Workspace Segregation Logic ───
  const secretaryTopics = useMemo(() => topics.filter((t) => t.councilRole === 'SECRETARY'), [topics]);
  const evaluatorTopics = useMemo(() => topics.filter((t) => t.councilRole !== 'SECRETARY'), [topics]);

  const showWorkspaceSwitch = secretaryTopics.length > 0 && evaluatorTopics.length > 0;

  useEffect(() => {
    if (secretaryTopics.length > 0 && evaluatorTopics.length === 0) setWorkspace('secretary');
    else if (secretaryTopics.length === 0 && evaluatorTopics.length > 0) setWorkspace('evaluator');
  }, [secretaryTopics.length, evaluatorTopics.length]);

  const activePool = workspace === 'secretary' ? secretaryTopics : evaluatorTopics;

  const pendingTopics = useMemo(() => activePool.filter((t) => t.topicStatus === 'PENDING_COUNCIL' || t.topicStatus === 'COUNCIL_REVIEWED'), [activePool]);
  const completedTopics = useMemo(() => activePool.filter((t) => t.topicStatus !== 'PENDING_COUNCIL' && t.topicStatus !== 'COUNCIL_REVIEWED'), [activePool]);

  const filteredTopics = activeTab === 'pending' ? pendingTopics : completedTopics;

  // ─── Render Helpers ───
  const getStatusCfg = (status) => {
    if (status === 'PENDING_COUNCIL' || status === 'COUNCIL_REVIEWED') return STATUS_BADGE_CFG.PENDING_COUNCIL;
    if (['APPROVED', 'REVISION_REQUIRED', 'REJECTED'].includes(status)) return STATUS_BADGE_CFG.COMPLETED;
    return STATUS_BADGE_CFG.DEFAULT;
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      
      {/* ── Page Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-8 py-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bảng điều khiển Công việc Hội đồng</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            {userClaims?.academicTitle ? `${userClaims.academicTitle} ` : ''}{userClaims?.fullName}
          </p>
          {workspace === 'secretary' && (
            <p className="text-xs text-indigo-700 font-medium mt-2 bg-indigo-50 inline-block px-3 py-1 rounded-md">
              🎯 Không gian Thư ký: Theo dõi tiến độ phiên họp và lập biên bản tổng hợp.
            </p>
          )}
          {workspace === 'evaluator' && showWorkspaceSwitch && (
            <p className="text-xs text-[#1a5ea8] font-medium mt-2 bg-blue-50 inline-block px-3 py-1 rounded-md">
              🎯 Không gian Chuyên gia: Xem thuyết minh đề tài và tiến hành chấm điểm.
            </p>
          )}
        </div>

        {/* Workspace Switcher */}
        {showWorkspaceSwitch && (
          <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-center">
            <button
              onClick={() => { setWorkspace('evaluator'); setActiveTab('pending'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                workspace === 'evaluator' ? 'bg-white text-[#1a5ea8] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Đánh giá & Chấm điểm
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${workspace === 'evaluator' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                {evaluatorTopics.length}
              </span>
            </button>
            <button
              onClick={() => { setWorkspace('secretary'); setActiveTab('pending'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                workspace === 'secretary' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Quản trị Phiên họp
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${workspace === 'secretary' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
                {secretaryTopics.length}
              </span>
            </button>
          </div>
        )}
      </header>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-5 transition hover:shadow-md">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <IcClipboard cls="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="text-3xl font-black text-blue-600 leading-none">{String(activePool.length).padStart(2, "0")}</p>
            <p className="text-sm font-bold text-gray-500 mt-1.5 uppercase tracking-wide">Đề tài phân công</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center gap-5 transition hover:shadow-md">
          <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <IcAlert cls="w-7 h-7 text-red-500" />
          </div>
          <div>
            <p className="text-3xl font-black text-red-500 leading-none">{String(pendingTopics.length).padStart(2, "0")}</p>
            <p className="text-sm font-bold text-gray-500 mt-1.5 uppercase tracking-wide">Chờ xử lý</p>
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        
        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-100 flex gap-2">
          {TABS.map((tab) => {
            const count = tab.key === 'pending' ? pendingTopics.length : completedTopics.length;
            const isActive = activeTab === tab.key;
            return (
              <button 
                key={tab.key} 
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-bold transition-all ${
                  isActive ? "bg-[#1a5ea8] text-white shadow-md shadow-blue-900/10" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                {tab.key === 'pending' && count > 0 && (
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5ea8]" />
              <p className="text-sm text-gray-500 font-medium">Đang tải dữ liệu hội đồng...</p>
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <IcCheck cls="w-8 h-8 text-green-500" />
              </div>
              <p className="text-base font-bold text-gray-800">Không có dữ liệu</p>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'pending' ? 'Tất cả đề tài phân công đã được xử lý xong.' : 'Chưa có đề tài nào được hoàn tất.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">Mã ĐT</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-left">Tên đề tài nghiên cứu</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Vai trò</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTopics.map((t) => {
                  const statusCfg = getStatusCfg(t.topicStatus);
                  return (
                    <tr key={`${t.topicId}-${t.councilId}`} className="hover:bg-blue-50/40 transition-colors group">
                      {/* Column 1: Mã ĐT */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="text-xs font-black text-[#1a5ea8] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
                          {t.topicCode}
                        </span>
                      </td>

                      {/* Column 2: Title & Details */}
                      <td className="py-4 px-6">
                        <p className="text-[13px] font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#1a5ea8] transition-colors">
                          {t.titleVn}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500 font-medium">
                          <span>CN: <strong className="text-gray-700">{t.investigatorFullName}</strong></span>
                          {t.councilName && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-[#4a7faa]">{t.councilName}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Role Badge */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        {t.councilRole && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-sm ${ROLE_BADGE_CFG[t.councilRole] ?? 'bg-gray-200 text-gray-700'}`}>
                            {getCouncilRoleLabel(t.councilRole)}
                          </span>
                        )}
                      </td>

                      {/* Column 4: Status Badge */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.icon}
                          {getStatusLabel(t.topicStatus)}
                        </span>
                      </td>

                      {/* Column 5: Actions */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <TopicAction topic={t} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Table Footer */}
        {!loading && filteredTopics.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500 font-medium">
              Hiển thị <span className="font-bold text-gray-800">{filteredTopics.length}</span> đề tài trong danh sách này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Component: Topic Action Buttons ────────────────────────────────────────

function TopicAction({ topic }) {
  const { topicId, topicStatus, councilRole } = topic;
  
  // SỬA LỖI: Tái sử dụng lại biến isPending để tránh lỗi unused-vars
  const isPending = topicStatus === 'PENDING_COUNCIL' || topicStatus === 'COUNCIL_REVIEWED'; 
  const evaluationRoles = new Set(['PRESIDENT', 'MEMBER', 'REVIEWER', 'REVIEWER_1', 'REVIEWER_2']);

  // Trường hợp đã có biên bản (Kết thúc hội đồng) -> Không còn là isPending nữa
  if (!isPending) {
    return (
      <Link 
        to={`/council/topics/${topicId}/minute`}
        className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition"
      >
        <IcDoc cls="w-3.5 h-3.5" />
        Xem biên bản
      </Link>
    );
  }

  // Phân tách workspace: Chủ tịch có không gian riêng; Thư ký dùng dashboard tracking.
  if (councilRole === 'PRESIDENT') {
    return (
      <div className="flex items-center justify-center gap-2">
        <Link
          to={`/council/topics/${topicId}/president`}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 hover:shadow-md transition"
        >
          <IcVideo cls="w-3.5 h-3.5" />
          Phòng làm việc Chủ tịch
        </Link>
      </div>
    );
  }
  if (councilRole === 'SECRETARY') {
    return (
      <div className="flex items-center justify-center gap-2">
        <Link
          to={`/council/topics/${topicId}/session`}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-bold bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 hover:shadow-md transition"
        >
          <IcVideo cls="w-3.5 h-3.5" />
          Quản trị phiên họp
        </Link>
      </div>
    );
  }

  if (evaluationRoles.has(councilRole)) {
    return (
      <Link 
        to={`/council/topics/${topicId}/evaluate`}
        className="inline-flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-bold bg-[#1a5ea8] text-white rounded-lg hover:bg-[#15306a] hover:shadow-md transition"
      >
        <IcClipboard cls="w-3.5 h-3.5" />
        Vào phòng đánh giá
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-gray-200 text-gray-400 text-xs font-bold">
      Không khả dụng
    </span>
  );
}