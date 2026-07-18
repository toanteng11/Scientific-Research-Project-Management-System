import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authApi } from '../../api/auth.api';
import useUiStore from '../../store/uiStore';
import { getRoleLabel } from '../../utils/formatters';

const profileSchema = yup.object({
  fullName: yup
    .string()
    .trim()
    .max(150, 'Họ tên không được vượt quá 150 ký tự')
    .optional(),
  academicTitle: yup
    .string()
    .trim()
    .max(50, 'Học hàm / học vị không được vượt quá 50 ký tự')
    .optional(),
});

/**
 * UserProfilePage — User self-service profile management.
 *
 * Route: /profile (authenticated, all roles)
 *
 * On mount: fetches GET /api/v1/auth/me → UserResponse
 *   { userId, email, fullName, academicTitle, systemRole, firstLogin, active, departmentName }
 *
 * Edit profile: PATCH /api/v1/auth/profile → { fullName?, academicTitle? }
 *   Returns updated UserResponse on 200.
 *
 * Note: Password change is a separate route (/change-password) to preserve
 * the single-responsibility principle and prevent form state conflicts.
 */
export default function UserProfilePage() {
  const addToast = useUiStore((s) => s.addToast);
  const [profile, setProfile] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: yupResolver(profileSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getMe();
        setProfile(response.data);
        reset({
          fullName: response.data.fullName ?? '',
          academicTitle: response.data.academicTitle ?? '',
        });
      } catch {
        setFetchError('Không thể tải thông tin hồ sơ. Vui lòng thử lại.');
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const response = await authApi.updateProfile({
        fullName: data.fullName?.trim() || undefined,
        academicTitle: data.academicTitle?.trim() || undefined,
      });
      setProfile(response.data);
      reset({
        fullName: response.data.fullName ?? '',
        academicTitle: response.data.academicTitle ?? '',
      });
      setIsEditing(false);
      addToast({ type: 'success', message: 'Hồ sơ đã được cập nhật thành công.' });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400) {
        addToast({ type: 'error', message: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    reset({
      fullName: profile?.fullName ?? '',
      academicTitle: profile?.academicTitle ?? '',
    });
    setIsEditing(false);
  };

  if (isFetching) {
    return (
      <div className="p-8">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          <p className="text-sm text-gray-500 mt-1">
            Xem và cập nhật thông tin cá nhân của bạn.
          </p>
        </div>

        {/* Read-only identity fields */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-800 border-b border-gray-100 pb-3">
            Thông tin tài khoản
          </h2>
          <ReadOnlyField label="Email" value={profile?.email} />
          <ReadOnlyField
            label="Vai trò"
            value={getRoleLabel(profile?.systemRole) || profile?.systemRole || '—'}
          />
          <ReadOnlyField label="Đơn vị / Khoa" value={profile?.departmentName ?? '—'} />
          <ReadOnlyField
            label="Trạng thái"
            value={profile?.active ? 'Đang hoạt động' : 'Đã bị khóa'}
            valueClass={profile?.active ? 'text-green-700' : 'text-red-600'}
          />
        </div>

        {/* Editable profile fields */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <h2 className="text-base font-semibold text-gray-800">Thông tin cá nhân</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm font-semibold text-[#1a3a7c] hover:underline"
              >
                Chỉnh sửa
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-sm font-semibold text-gray-700">
                  Họ và tên
                </label>
                <input
                  id="fullName"
                  type="text"
                  {...register('fullName')}
                  className={`w-full h-10 rounded-md border px-3 text-sm outline-none
                              transition focus:ring-2 focus:ring-[#1a5ea8]/20
                              ${errors.fullName
                                ? 'border-red-400'
                                : 'border-gray-300 hover:border-gray-400 focus:border-[#1a5ea8]'
                              }`}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500">{errors.fullName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="academicTitle" className="text-sm font-semibold text-gray-700">
                  Học hàm / Học vị
                </label>
                <input
                  id="academicTitle"
                  type="text"
                  placeholder="Vd: ThS., TS., GS.TS.,..."
                  {...register('academicTitle')}
                  className={`w-full h-10 rounded-md border px-3 text-sm outline-none
                              transition focus:ring-2 focus:ring-[#1a5ea8]/20
                              ${errors.academicTitle
                                ? 'border-red-400'
                                : 'border-gray-300 hover:border-gray-400 focus:border-[#1a5ea8]'
                              }`}
                />
                {errors.academicTitle && (
                  <p className="text-xs text-red-500">{errors.academicTitle.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSaving || !isDirty}
                  className="px-5 py-2 rounded-md bg-[#1a3a7c] text-white text-sm font-semibold
                             hover:bg-[#15306a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-semibold
                             hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <ReadOnlyField label="Họ và tên" value={profile?.fullName} />
              <ReadOnlyField
                label="Học hàm / Học vị"
                value={profile?.academicTitle || '—'}
              />
            </div>
          )}
        </div>

        {/* Password change link */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Bảo mật</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Thay đổi mật khẩu đăng nhập của bạn.
              </p>
            </div>
            <a
              href="/change-password"
              className="text-sm font-semibold text-[#1a3a7c] hover:underline"
            >
              Đổi mật khẩu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadOnlyField({ label, value, valueClass = 'text-gray-800' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value ?? '—'}</span>
    </div>
  );
}
