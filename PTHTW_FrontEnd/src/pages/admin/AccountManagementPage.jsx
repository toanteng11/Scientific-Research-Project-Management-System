import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { usersApi } from '../../api/users.api';
import useUiStore from '../../store/uiStore';
import { getRoleLabel } from '../../utils/formatters';

export default function AccountManagementPage() {
  const addToast = useUiStore((s) => s.addToast);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({ page: p, size: 15, sort: 'userId,desc' });
      setUsers(res.data?.content ?? []);
      setTotalPages(res.data?.totalPages ?? 0);
    } catch { /* interceptor */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(page); }, [page, fetchUsers]);

  const handleToggleActive = async (userId, currentActive) => {
    if (!confirm(`Xác nhận ${currentActive ? 'khóa' : 'mở khóa'} tài khoản?`)) return;
    try {
      await usersApi.updateStatus(userId, !currentActive);
      addToast({ type: 'success', message: `Tài khoản đã được ${currentActive ? 'khóa' : 'mở khóa'}.` });
      fetchUsers(page);
    } catch { /* interceptor */ }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
        <div className="flex gap-2">
          <Link to="/admin/users/new/researcher" className="px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700">+ Nghiên cứu viên</Link>
          <Link to="/admin/users/new/manager" className="px-3 py-2 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700">+ Quản lý KH</Link>
          <Link to="/admin/users/new/dept-head" className="px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700">+ Trưởng khoa</Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Họ tên</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Vai trò</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Khoa</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-center"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{getRoleLabel(u.systemRole)}</span></td>
                  <td className="px-4 py-3 text-center text-gray-600 text-xs">{u.departmentName ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.active ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggleActive(u.userId, u.active)}
                      className={`text-xs font-medium px-2 py-1 rounded ${u.active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                      {u.active ? 'Khóa' : 'Mở khóa'}
                    </button>
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
