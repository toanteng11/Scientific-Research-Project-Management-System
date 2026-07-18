import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { usersApi } from '../../api/users.api';
import { departmentsApi } from '../../api/departments.api';
import useUiStore from '../../store/uiStore';
import { applyFieldErrors } from '../../utils/errorHandler';

const ROLE_CONFIG = {
  researcher: { label: 'Nghiên cứu viên', createFn: (data) => usersApi.createResearcher(data), needsDept: true },
  manager: { label: 'Quản lý Khoa học', createFn: (data) => usersApi.createManager(data), needsDept: false },
  'dept-head': { label: 'Trưởng khoa', createFn: (data) => usersApi.createDeptHead(data), needsDept: true },
};

// Sử dụng dynamic validation schema dựa trên context
const schema = yup.object({
  email: yup.string().required('Bắt buộc').email('Email không hợp lệ'),
  fullName: yup.string().required('Bắt buộc').max(150),
  academicTitle: yup.string().max(50),
  initialPassword: yup.string().required('Bắt buộc').min(8, 'Tối thiểu 8 ký tự'),
  departmentId: yup.string().when('$needsDept', {
    is: true,
    then: (schema) => schema.required('Bắt buộc'),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
});

export default function CreateUserPage() {
  const { role } = useParams();
  const navigate = useNavigate();
  const addToast = useUiStore((s) => s.addToast);
  
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const config = ROLE_CONFIG[role];
  const needsDept = config?.needsDept || false;

  // GIẢI PHÁP: Kéo TẤT CẢ các Hooks lên đây, TRƯỚC khi có bất kỳ lệnh `return` điều kiện nào
  const { register, handleSubmit, setError, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    context: { needsDept },
  });

  useEffect(() => {
    if (needsDept) {
      departmentsApi.fetchAllDepartments()
        .then(setDepartments)
        .catch(() => {});
    }
  }, [needsDept]);

  // SAU KHI các Hooks đã chạy xong, mới được phép return điều kiện (Early Return)
  if (!config) return <div className="text-center py-12 text-gray-500 font-medium">Vai trò không hợp lệ.</div>;

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { 
        email: data.email, 
        fullName: data.fullName, 
        academicTitle: data.academicTitle || null, 
        initialPassword: data.initialPassword 
      };
      if (config.needsDept) {
        payload.departmentId = data.departmentId;
      }
      await config.createFn(payload);
      addToast({ type: 'success', message: `Đã tạo tài khoản ${config.label}.` });
      navigate('/admin/users');
    } catch (err) {
      if (err.response?.status === 400) applyFieldErrors(err, setError);
      else addToast({ type: 'error', message: 'Có lỗi xảy ra khi tạo tài khoản.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/admin/users')} className="text-sm text-blue-600 hover:underline mb-4 inline-block font-semibold transition">&larr; Quay lại</button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo tài khoản {config.label}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Email liên hệ <span className="text-red-500">*</span></label>
          <input type="email" {...register('email')} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 transition outline-none ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`} />
          {errors.email && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
          <input {...register('fullName')} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 transition outline-none ${errors.fullName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`} />
          {errors.fullName && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Học hàm / Học vị</label>
          <input {...register('academicTitle')} placeholder="VD: PGS.TS" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition outline-none" />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Mật khẩu ban đầu <span className="text-red-500">*</span></label>
          <input type="password" {...register('initialPassword')} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 transition outline-none ${errors.initialPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`} />
          {errors.initialPassword && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.initialPassword.message}</p>}
        </div>

        {config.needsDept && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Đơn vị (Khoa) <span className="text-red-500">*</span></label>
            <select {...register('departmentId')} className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:ring-2 transition outline-none ${errors.departmentId ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'}`}>
              <option value="">— Chọn đơn vị trực thuộc —</option>
              {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
            </select>
            {errors.departmentId && <p className="text-[11px] font-medium text-red-500 mt-1">{errors.departmentId.message}</p>}
          </div>
        )}

        {errors.root && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-700 font-medium">{errors.root.message}</div>}

        <div className="pt-2 border-t border-gray-100 mt-6">
          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-[#1a5ea8] text-white font-bold rounded-lg hover:bg-[#15306a] disabled:opacity-50 text-sm transition shadow-sm">
            {submitting ? 'Đang khởi tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </div>
  );
}