import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { councilsApi } from '../../api/councils.api';
import { formatDate } from '../../utils/formatters';
import useUiStore from '../../store/uiStore';
import FocusTrappedModal from '../../components/ui/FocusTrappedModal';

// Icons phụ trợ cho giao diện
const Svg = ({ d, cls = "w-4 h-4", sw = 2, fill = "none" }) => (
  <svg aria-hidden="true" className={`flex-shrink-0 ${cls}`} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={sw}>
    {[].concat(d).map((p, i) => <path key={i} strokeLinecap="round" strokeLinejoin="round" d={p} />)}
  </svg>
);
const IcUserPlus = p => <Svg {...p} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />;
const IcX = p => <Svg {...p} d="M6 18L18 6M6 6l12 12" />;

export default function CouncilManagementPage() {
  const addToast = useUiStore((s) => s.addToast);
  
  const [councils, setCouncils] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // State quản lý Modal tạo chuyên gia
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [expertLoading, setExpertLoading] = useState(false);
  const { register: regExpert, handleSubmit: handleExpertSubmit, reset: resetExpert, formState: { errors: errExpert } } = useForm();

  const fetchCouncils = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await councilsApi.getAll({ page: p, size: 10, sort: 'councilId,desc' });
      
      const payload = res.data || res;
      
      setCouncils(payload?.content || []);
      setTotalPages(payload?.totalPages || 0);
    } catch (error) {
      console.error("LỖI TẢI DANH SÁCH HỘI ĐỒNG (QUẢN LÝ):", error.response?.data || error.message);
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchCouncils(page); }, [page, fetchCouncils]);

  // Hàm xử lý gửi form tạo chuyên gia
  const onSubmitExpert = async (data) => {
    setExpertLoading(true);
    try {
      await councilsApi.createCouncilExpert({
        email: data.email,
        fullName: data.fullName,
        academicTitle: data.academicTitle || 'Khác'
      });
      addToast({ type: 'success', message: 'Tạo tài khoản chuyên gia thành công. Email hệ thống đã được gửi đi!' });
      setShowExpertModal(false);
      resetExpert(); // Xóa trắng form sau khi tạo xong
    } catch (error) {
      console.error("Lỗi tạo chuyên gia:", error);
      addToast({ type: 'error', message: error.response?.data?.message || 'Lỗi khi tạo tài khoản chuyên gia.' });
    } finally {
      setExpertLoading(false);
    }
  };

  return (
    <div>
      {/* HEADER & ACTION BUTTONS */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Hội đồng</h1>
        
        <div className="flex items-center gap-3">
          {/* Nút mở Modal tạo Chuyên gia độc lập */}
          <button 
            onClick={() => setShowExpertModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-medium rounded-md hover:bg-indigo-100 transition shadow-sm"
          >
            <IcUserPlus /> Tạo Tài khoản 
          </button>
          
          <Link to="/manager/councils/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 shadow-sm transition">
            Tạo Hội đồng mới
          </Link>
        </div>
      </div>

      {/* DANH SÁCH HỘI ĐỒNG */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : councils.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border"><p className="text-gray-500">Chưa có Hội đồng nào.</p></div>
      ) : (
        <div className="space-y-3">
          {councils.map((c) => (
            <Link key={c.councilId} to={`/manager/councils/${c.councilId}`}
              className="block bg-white rounded-lg border p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{c.councilName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.meetingLocation} — {formatDate(c.meetingDate)}</p>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded">{c.memberCount ?? 0} thành viên</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{c.topicCount ?? 0} đề tài</span>
                </div>
              </div>
            </Link>
          ))}
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50">Trước</button>
              <span className="px-3 py-1 text-sm text-gray-700 font-medium bg-gray-100 rounded">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50">Sau</button>
            </div>
          )}
        </div>
      )}

      {/* MODAL TẠO TÀI KHOẢN CHUYÊN GIA */}
      {showExpertModal && (
        <FocusTrappedModal onClose={() => !expertLoading && setShowExpertModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b bg-indigo-50 flex items-center justify-between">
              <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                <IcUserPlus /> Khởi tạo Tài khoản Chuyên gia
              </h3>
              <button onClick={() => !expertLoading && setShowExpertModal(false)} className="text-gray-400 hover:text-gray-600">
                <IcX />
              </button>
            </div>
            
            <form onSubmit={handleExpertSubmit(onSubmitExpert)} className="p-6 space-y-4">
              <p className="text-xs text-gray-500 mb-4">
                Hệ thống sẽ tự động gửi thông tin đăng nhập và mật khẩu khởi tạo đến địa chỉ email được cung cấp dưới đây.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Họ và Tên <span className="text-red-500">*</span></label>
                <input 
                  {...regExpert('fullName', { required: true })} 
                  placeholder="VD: Nguyễn Văn A"
                  className={`w-full h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 transition ${errExpert.fullName ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20'}`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Địa chỉ Email <span className="text-red-500">*</span></label>
                <input 
                  type="email"
                  {...regExpert('email', { required: true, pattern: /^\S+@\S+$/i })} 
                  placeholder="VD: chuyengia@domain.com"
                  className={`w-full h-10 border rounded-lg px-3 text-sm outline-none focus:ring-2 transition ${errExpert.email ? 'border-red-500 ring-red-200' : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20'}`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Học hàm / Học vị</label>
                <select 
                  {...regExpert('academicTitle')} 
                  className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 transition"
                >
                  <option value="Khác">-- Chọn Học hàm/Học vị --</option>
                  <option value="GS.">Giáo sư (GS.)</option>
                  <option value="PGS.">Phó Giáo sư (PGS.)</option>
                  <option value="TS.">Tiến sĩ (TS.)</option>
                  <option value="ThS.">Thạc sĩ (ThS.)</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button type="button" onClick={() => setShowExpertModal(false)} disabled={expertLoading} className="flex-1 h-10 border border-gray-200 rounded-lg text-gray-600 font-bold hover:bg-gray-50 transition">Hủy</button>
                <button type="submit" disabled={expertLoading} className="flex-1 h-10 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                  {expertLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : 'Tạo & Gửi Email'}
                </button>
              </div>
            </form>
          </div>
        </FocusTrappedModal>
      )}
    </div>
  );
}