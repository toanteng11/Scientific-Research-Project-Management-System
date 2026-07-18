import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { topicsApi } from '../../api/topics.api';
import useUiStore from '../../store/uiStore';
import { getStatusLabel, getStatusColor, formatVND } from '../../utils/formatters';
import { getAvailableActions } from '../../utils/topicStatusConfig';

const STATUS_ICON_MAP = {
  DRAFT: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  PENDING_REVIEW: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  DEPT_APPROVED: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  DEPT_REJECTED: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  APPROVED: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  REJECTED: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
};

export default function ResearcherDashboardPage() {
  const addToast = useUiStore((s) => s.addToast);
  const [topics, setTopics] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchTopics = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await topicsApi.getMyTopics({ page: p, size: 10, sort: 'topicId,desc' });
      setTopics(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 0);
      setTotalElements(res.data?.totalElements ?? 0);
    } catch { /* interceptor */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTopics(page); }, [page, fetchTopics]);

  const handleAction = async (topicId, targetStatus) => {
    setActionLoading(topicId);
    try {
      await topicsApi.changeStatus(topicId, { targetStatus });
      addToast({ type: 'success', message: 'Cap nhat trang thai thanh cong.' });
      fetchTopics(page);
    } catch { /* interceptor */ }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">De tai cua toi</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalElements > 0 ? `${totalElements} de tai nghien cuu da dang ky` : 'Danh sach de tai nghien cuu da dang ky.'}
          </p>
        </div>
        <Link to="/researcher/topics/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nop de tai moi
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          <p className="text-gray-500 font-medium">Ban chua co de tai nao.</p>
          <Link to="/researcher/topics/new" className="text-blue-600 text-sm mt-2 inline-block hover:underline font-medium">Tao de tai dau tien &rarr;</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {topics.map((t) => {
            const actions = getAvailableActions(t.topicStatus, 'RESEARCHER');
            const iconPath = STATUS_ICON_MAP[t.topicStatus] || STATUS_ICON_MAP.DRAFT;
            const canRevise = t.topicStatus === 'DEPT_REJECTED' || t.topicStatus === 'REVISION_REQUIRED';

            return (
              <div key={t.topicId} className="group bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(t.topicStatus).replace('text-', 'text-').split(' ')[0]}`}>
                      <svg className={`w-5 h-5 ${getStatusColor(t.topicStatus).split(' ')[1]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={iconPath} /></svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <Link to={`/researcher/topics/${t.topicId}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                          {t.titleVn}
                        </Link>
                        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(t.topicStatus)}`}>
                          {getStatusLabel(t.topicStatus)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="font-mono text-gray-400">{t.topicCode}</span>
                        <span className="text-gray-300">&middot;</span>
                        <span>{t.managingDepartmentName}</span>
                        <span className="text-gray-300">&middot;</span>
                        <span className="font-medium text-gray-600">{formatVND(t.expectedBudget)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  {(actions.length > 0 || canRevise) && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                      {actions.map((a) => (
                        <button key={a.targetStatus} onClick={() => handleAction(t.topicId, a.targetStatus)}
                          disabled={actionLoading === t.topicId}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${
                            a.targetStatus === 'PENDING_REVIEW'
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}>
                          {actionLoading === t.topicId && <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />}
                          {a.label}
                        </button>
                      ))}
                      {canRevise && (
                        <Link to={`/researcher/topics/${t.topicId}/revise`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Chinh sua
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">Trang {page + 1} / {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  Truoc
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Sau
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
