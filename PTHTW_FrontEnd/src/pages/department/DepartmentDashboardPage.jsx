import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { departmentsApi } from '../../api/departments.api';
import { getStatusLabel, getStatusColor, formatVND } from '../../utils/formatters';

export default function DepartmentDashboardPage() {
  const [topics, setTopics] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTopics = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await departmentsApi.getMyTopics({ page: p, size: 10, sort: 'topicId,desc' });
      setTopics(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 0);
    } catch { /* interceptor */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTopics(page); }, [page, fetchTopics]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đề tài Khoa phụ trách</h1>
        <p className="text-sm text-gray-500 mt-1">Danh sách đề tài cần xét duyệt cấp Khoa.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : topics.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500">Không có đề tài nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((t) => (
            <Link key={t.topicId} to={`/department/topics/${t.topicId}`}
              className="block bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{t.titleVn}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.topicCode} — {t.investigatorFullName}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(t.topicStatus)}`}>
                  {getStatusLabel(t.topicStatus)}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>Kinh phí: {formatVND(t.expectedBudget)}</span>
                <span>{t.managingDepartmentName}</span>
              </div>
            </Link>
          ))}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50">Trước</button>
              <span className="px-3 py-1 text-sm text-gray-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50">Sau</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
