import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { topicsApi } from '../../api/topics.api';
import { getStatusLabel, getStatusColor, formatVND } from '../../utils/formatters';

export default function AllTopicsListPage() {
  const [topics, setTopics] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTopics = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await topicsApi.getAll({ page: p, size: 15, sort: 'topicId,desc' });
      setTopics(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 0);
    } catch { /* interceptor */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTopics(page); }, [page, fetchTopics]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tất cả đề tài</h1>
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Mã</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tên đề tài</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Chủ nhiệm</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kinh phí</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {topics.map((t) => (
                <tr key={t.topicId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.topicCode}</td>
                  <td className="px-4 py-3">
                    <Link to={`/manager/topics/${t.topicId}`} className="text-gray-900 hover:text-blue-600 font-medium line-clamp-1">{t.titleVn}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.investigatorFullName}</td>
                  <td className="px-4 py-3 text-gray-600">{formatVND(t.expectedBudget)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(t.topicStatus)}`}>
                      {getStatusLabel(t.topicStatus)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 py-3 border-t">
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
