import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsApi } from '../../api/stats.api';
import { usersApi } from '../../api/users.api';
import { getRoleLabel } from '../../utils/formatters';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          statsApi.getSummary(),
          usersApi.getAll({ page: 0, size: 5, sort: 'userId,desc' }),
        ]);
        setStats(statsRes.data);
        setRecentUsers(usersRes.data?.content ?? []);
      } catch { /* interceptor */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Trang chủ Quản trị viên</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-5">
          <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Tổng người dùng</p>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <p className="text-3xl font-bold text-green-600">{stats?.activeUsers ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Đang hoạt động</p>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <p className="text-3xl font-bold text-purple-600">{stats?.totalCouncils ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Hội đồng</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-800">Người dùng gần đây</h3>
          <Link to="/admin/users" className="text-xs text-blue-600 hover:underline">Quản lý tài khoản</Link>
        </div>
        <div className="divide-y">
          {recentUsers.map((u) => (
            <div key={u.userId} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{getRoleLabel(u.systemRole)}</span>
                <span className={`w-2 h-2 rounded-full ${u.active ? 'bg-green-500' : 'bg-red-400'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
