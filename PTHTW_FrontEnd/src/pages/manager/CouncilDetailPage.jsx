import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { councilsApi } from '../../api/councils.api';
import { topicsApi } from '../../api/topics.api';
import { usersApi } from '../../api/users.api';
import useUiStore from '../../store/uiStore';
import { formatDate, getStatusLabel, getStatusColor, getCouncilRoleLabel } from '../../utils/formatters';

const COUNCIL_ROLES =['PRESIDENT', 'SECRETARY', 'REVIEWER_1', 'REVIEWER_2', 'MEMBER'];

const expertSchema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Bắt buộc'),
  fullName: yup.string().required('Bắt buộc'),
  academicTitle: yup.string()
});

export default function CouncilDetailPage() {
  const { councilId } = useParams();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  
  const [council, setCouncil] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [deptApprovedTopics, setDeptApprovedTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');
  
  const [showAssignTopic, setShowAssignTopic] = useState(false);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  
  const [showCreateExpert, setShowCreateExpert] = useState(false);
  const [creatingExpert, setCreatingExpert] = useState(false);

  const { register: regExp, handleSubmit: handleExpSubmit, reset: resetExp, formState: { errors: errExp } } = useForm({
    resolver: yupResolver(expertSchema)
  });

  const fetchCouncilData = useCallback(async () => {
    try {
      const [councilRes, usersRes, topicsRes] = await Promise.all([
        councilsApi.getById(councilId),
        usersApi.getAll({ page: 0, size: 500 }), 
        topicsApi.getAll({ page: 0, size: 100, sort: 'topicId,desc' }),
      ]);
      setCouncil(councilRes.data);
      setAllUsers(usersRes.data?.content ||[]);
      setDeptApprovedTopics(topicsRes.data?.content?.filter(t => t.topicStatus === 'DEPT_APPROVED' && !t.assignedCouncilId) ||[]);
    } catch { /* Interceptor handles */ }
  }, [councilId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchCouncilData();
      setLoading(false);
    };
    load();
  }, [fetchCouncilData]);

  const handleAssignMember = async () => {
    if (!newMemberUserId) return;
    setActionLoading(true);
    try {
      await councilsApi.assignMembers(councilId, {
        members:[{ userId: Number(newMemberUserId), councilRole: newMemberRole }]
      });
      addToast({ type: 'success', message: 'Đã phân công thành viên vào hội đồng.' });
      await fetchCouncilData();
      setShowAddMember(false);
      setNewMemberUserId('');
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Lỗi khi phân công.' });
    } finally {
      setActionLoading(false);
    }
  };

  const onCreateExpert = async (data) => {
    setCreatingExpert(true);
    try {
      const res = await usersApi.createCouncilExpert(data);
      addToast({ type: 'success', message: 'Đã tạo tài khoản chuyên gia. Mật khẩu đã được gửi qua email.' });
      await fetchCouncilData(); 
      setNewMemberUserId(String(res.data.userId)); 
      setShowCreateExpert(false);
      setShowAddMember(true);
      resetExp();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Không thể tạo chuyên gia.' });
    } finally {
      setCreatingExpert(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Xác nhận gỡ thành viên khỏi hội đồng?')) return;
    try {
      await councilsApi.removeMember(councilId, userId);
      addToast({ type: 'success', message: 'Đã gỡ thành viên.' });
      await fetchCouncilData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Lỗi khi gỡ thành viên.' });
    }
  };

  const handleAssignTopics = async () => {
    if (selectedTopicIds.length === 0) return;
    setActionLoading(true);
    try {
      await councilsApi.assignTopics(councilId, { topicIds: selectedTopicIds.map(Number) });
      addToast({ type: 'success', message: 'Đã giao đề tài cho hội đồng thẩm định.' });
      await fetchCouncilData();
      setShowAssignTopic(false);
      setSelectedTopicIds([]);
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Lỗi phân công đề tài.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveTopic = async (topicId) => {
    if (!window.confirm('Xác nhận thu hồi đề tài khỏi hội đồng này?')) return;
    try {
      await councilsApi.removeTopic(councilId, topicId);
      addToast({ type: 'success', message: 'Đã thu hồi đề tài.' });
      await fetchCouncilData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Lỗi khi thu hồi đề tài.' });
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!council) return <div className="text-center py-12 text-gray-500">Không tìm thấy Hội đồng.</div>;

  const availableExperts = allUsers.filter(u => u.systemRole === 'COUNCIL' && !council.members?.some(m => m.userId === u.userId));

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate('/manager/councils')} className="text-sm text-blue-600 hover:underline mb-4 inline-block">&larr; Về danh sách Hội đồng</button>

      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900">{council.councilName}</h1>
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm bg-gray-50 p-4 rounded-md">
          <div><span className="text-gray-500 block text-xs uppercase font-bold tracking-wider mb-1">Ngày họp</span> <span className="font-semibold">{formatDate(council.meetingDate)}</span></div>
          <div><span className="text-gray-500 block text-xs uppercase font-bold tracking-wider mb-1">Giờ họp</span> <span className="font-semibold">{String(council.meetingTime).substring(0,5)}</span></div>
          <div><span className="text-gray-500 block text-xs uppercase font-bold tracking-wider mb-1">Địa điểm</span> <span className="font-semibold">{council.meetingLocation}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">Nhân sự Hội đồng ({council.members?.length ?? 0})</h3>
            <button onClick={() => { setShowAddMember(!showAddMember); setShowCreateExpert(false); }} className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition">
              {showAddMember ? 'Đóng' : '+ Phân công chuyên gia'}
            </button>
          </div>

          {showAddMember && (
            <div className="mb-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Chọn chuyên gia có sẵn</span>
                <button onClick={() => { setShowCreateExpert(!showCreateExpert); setShowAddMember(false); }} className="text-xs text-[#1a5ea8] underline font-semibold">Tạo tài khoản chuyên gia mới</button>
              </div>
              <div className="flex flex-col gap-3">
                <select value={newMemberUserId} onChange={(e) => setNewMemberUserId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white outline-none focus:border-blue-500">
                  <option value="">— Chọn chuyên gia —</option>
                  {availableExperts.map((u) => <option key={u.userId} value={u.userId}>{u.academicTitle ? `${u.academicTitle} ` : ''}{u.fullName} ({u.email})</option>)}
                </select>
                <div className="flex gap-2">
                  <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white outline-none focus:border-blue-500">
                    {COUNCIL_ROLES.map((r) => <option key={r} value={r}>{getCouncilRoleLabel(r)}</option>)}
                  </select>
                  <button onClick={handleAssignMember} disabled={!newMemberUserId || actionLoading} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 transition">Phân công</button>
                </div>
              </div>
            </div>
          )}

          {showCreateExpert && (
            <div className="mb-4 p-4 bg-green-50/50 rounded-lg border border-green-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-green-800 uppercase tracking-wider">Tạo tài khoản Chuyên gia mới</span>
                <button onClick={() => { setShowCreateExpert(false); setShowAddMember(true); }} className="text-xs text-gray-500 underline hover:text-gray-700">Hủy</button>
              </div>
              <form onSubmit={handleExpSubmit(onCreateExpert)} className="space-y-3">
                <input {...regExp('fullName')} placeholder="Họ và tên *" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                {errExp.fullName && <p className="text-[10px] text-red-500">{errExp.fullName.message}</p>}
                
                <input {...regExp('email')} placeholder="Email liên hệ *" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                {errExp.email && <p className="text-[10px] text-red-500">{errExp.email.message}</p>}
                
                <input {...regExp('academicTitle')} placeholder="Học hàm/Học vị (Ví dụ: PGS.TS)" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                
                <button type="submit" disabled={creatingExpert} className="w-full py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:opacity-50">
                  {creatingExpert ? 'Đang tạo...' : 'Tạo Tài khoản & Gửi Mật khẩu'}
                </button>
              </form>
            </div>
          )}

          <div className="divide-y border-t border-gray-100 flex-1">
            {(council.members ??[]).map((m) => (
              <div key={m.userId} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{m.fullName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-bold uppercase tracking-wider">{getCouncilRoleLabel(m.councilRole)}</span>
                  <button onClick={() => handleRemoveMember(m.userId)} className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition">Gỡ</button>
                </div>
              </div>
            ))}
            {(!council.members || council.members.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-6 italic">Hội đồng chưa có thành viên.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">Đề tài thẩm định ({council.topics?.length ?? 0})</h3>
            <button onClick={() => setShowAssignTopic(!showAssignTopic)} className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition">
              {showAssignTopic ? 'Đóng' : '+ Giao đề tài mới'}
            </button>
          </div>

          {showAssignTopic && (
            <div className="mb-4 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block mb-3">Chọn đề tài đã qua Sơ duyệt Khoa</span>
              {deptApprovedTopics.length === 0 ? (
                <p className="text-xs text-gray-500 italic">Không có đề tài nào đang chờ ở trạng thái "Khoa đã duyệt". Vui lòng duyệt thủ tục các đề tài trước khi giao hội đồng.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {deptApprovedTopics.map((t) => (
                    <label key={t.topicId} className="flex items-start gap-2 p-2 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-indigo-300">
                      <input type="checkbox" className="mt-1" checked={selectedTopicIds.includes(String(t.topicId))}
                        onChange={(e) => setSelectedTopicIds(prev => e.target.checked ? [...prev, String(t.topicId)] : prev.filter(id => id !== String(t.topicId)))} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 leading-tight">{t.topicCode} — {t.titleVn}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">Chủ nhiệm: {t.investigatorFullName}</p>
                      </div>
                    </label>
                  ))}
                  <button onClick={handleAssignTopics} disabled={selectedTopicIds.length === 0 || actionLoading}
                    className="w-full mt-2 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-50 transition">
                    Giao {selectedTopicIds.length} đề tài cho Hội đồng
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="divide-y border-t border-gray-100 flex-1">
            {(council.topics ??[]).map((t) => (
              <div key={t.topicId} className="flex flex-col py-3 gap-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-4">
                    <Link to={`/manager/topics/${t.topicId}`} className="font-bold text-sm text-gray-900 hover:text-blue-600 line-clamp-2 leading-tight">{t.titleVn}</Link>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{t.topicCode}</p>
                  </div>
                  <button onClick={() => handleRemoveTopic(t.topicId)} className="text-xs font-semibold text-red-500 hover:text-red-700 whitespace-nowrap bg-red-50 px-2 py-1 rounded">Thu hồi</button>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(t.topicStatus)}`}>{getStatusLabel(t.topicStatus)}</span>
                </div>
              </div>
            ))}
            {(!council.topics || council.topics.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-6 italic">Chưa có đề tài nào được giao.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
