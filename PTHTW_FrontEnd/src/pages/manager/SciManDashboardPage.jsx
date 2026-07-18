import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '../../api/stats.api';
import { topicsApi } from '../../api/topics.api';
import { getStatusLabel, getStatusColor } from '../../utils/formatters';

const KPI_ITEMS = [
  { key: 'topicsDraft', label: 'Bản nháp', color: 'bg-gray-100 text-gray-700' },
  { key: 'topicsPendingReview', label: 'Chờ duyệt Khoa', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'topicsDeptApproved', label: 'Khoa đã duyệt', color: 'bg-blue-100 text-blue-700' },
  { key: 'topicsPendingCouncil', label: 'Chờ Hội đồng', color: 'bg-indigo-100 text-indigo-700' },
  { key: 'topicsCouncilReviewed', label: 'HĐ đã đánh giá', color: 'bg-purple-100 text-purple-700' },
  { key: 'topicsRevisionRequired', label: 'Cần chỉnh sửa', color: 'bg-orange-100 text-orange-800' },
  { key: 'topicsApproved', label: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
  { key: 'topicsRejected', label: 'Không duyệt', color: 'bg-red-100 text-red-700' },
];

export default function SciManDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentTopics, setRecentTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, topicsRes] = await Promise.all([
          statsApi.getSummary(),
          topicsApi.getAll({ page: 0, size: 5, sort: 'topicId,desc' }),
        ]);
        setStats(statsRes.data);
        setRecentTopics(topicsRes.data?.content ?? []);
      } catch { /* interceptor */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a5ea8]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan Quản lý Khoa học</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi tiến độ xét duyệt và luân chuyển đề tài</p>
        </div>
      </div>

      {/* KPI cards - Đề tài */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {KPI_ITEMS.map((kpi) => (
          <div key={kpi.key} className={`rounded-xl p-5 border border-white/20 shadow-sm transition hover:shadow-md ${kpi.color}`}>
            <p className="text-3xl font-black mb-1">{stats?.[kpi.key] ?? 0}</p>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* KPI cards - Hội đồng (Đã loại bỏ số liệu User không cần thiết) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl p-5 bg-gradient-to-br from-slate-800 to-slate-700 text-white shadow-md flex items-center justify-between">
          <div>
            <p className="text-3xl font-black mb-1">{stats?.totalCouncils ?? 0}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Tổng số Hội đồng Xét duyệt</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Recent topics */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Đề tài cập nhật gần đây</h3>
          <Link to="/manager/topics" className="text-xs font-semibold text-[#1a5ea8] hover:underline bg-blue-50 px-3 py-1.5 rounded-md transition">Xem toàn bộ đề tài &rarr;</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentTopics.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500 italic">Chưa có đề tài nào trong hệ thống.</div>
          ) : (
            recentTopics.map((t) => (
              <Link key={t.topicId} to={`/manager/topics/${t.topicId}`} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-blue-50/30 transition group">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#1a5ea8] transition">{t.titleVn}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{t.topicCode}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[11px] font-medium text-gray-600">{t.investigatorFullName}</span>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(t.topicStatus)}`}>
                    {getStatusLabel(t.topicStatus)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}