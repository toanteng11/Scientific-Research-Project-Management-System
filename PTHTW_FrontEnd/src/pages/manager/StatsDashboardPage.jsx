import { useState, useEffect } from 'react';
import { statsApi } from '../../api/stats.api';

const STAT_ITEMS = [
  { key: 'topicsDraft', label: 'Bản nháp', color: 'border-gray-300' },
  { key: 'topicsPendingReview', label: 'Chờ duyệt Khoa', color: 'border-yellow-400' },
  { key: 'topicsDeptApproved', label: 'Khoa đã duyệt', color: 'border-blue-400' },
  { key: 'topicsDeptRejected', label: 'Khoa từ chối', color: 'border-red-300' },
  { key: 'topicsPendingCouncil', label: 'Chờ Hội đồng', color: 'border-indigo-400' },
  { key: 'topicsCouncilReviewed', label: 'HĐ đã đánh giá', color: 'border-purple-400' },
  { key: 'topicsRevisionRequired', label: 'Cần chỉnh sửa', color: 'border-orange-400' },
  { key: 'topicsApproved', label: 'Đã duyệt', color: 'border-green-400' },
  { key: 'topicsRejected', label: 'Không duyệt', color: 'border-red-400' },
];

export default function StatsDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await statsApi.getSummary();
        setStats(res.data);
      } catch { /* interceptor */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Thống kê hệ thống</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border-l-4 border-blue-500 p-5">
          <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Tổng người dùng</p>
        </div>
        <div className="bg-white rounded-lg border-l-4 border-green-500 p-5">
          <p className="text-3xl font-bold text-gray-900">{stats?.activeUsers ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Đang hoạt động</p>
        </div>
        <div className="bg-white rounded-lg border-l-4 border-purple-500 p-5">
          <p className="text-3xl font-bold text-gray-900">{stats?.totalCouncils ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Hội đồng</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">Phân bố đề tài theo trạng thái</h2>
      <div className="grid grid-cols-3 gap-3">
        {STAT_ITEMS.map((item) => (
          <div key={item.key} className={`bg-white rounded-lg border-l-4 ${item.color} p-4`}>
            <p className="text-2xl font-bold text-gray-900">{stats?.[item.key] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {stats?.topicsPendingTotal != null && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800">Tổng đề tài đang chờ xử lý: <span className="text-lg font-bold">{stats.topicsPendingTotal}</span></p>
        </div>
      )}
    </div>
  );
}
