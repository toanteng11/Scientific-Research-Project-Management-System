import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authApi } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';

const schema = yup.object({
  currentPassword: yup
    .string()
    .required('Vui lòng nhập mật khẩu hiện tại'),
  newPassword: yup
    .string()
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .max(128, 'Mật khẩu mới không được vượt quá 128 ký tự')
    .matches(
      /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$/,
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
    )
    .notOneOf([yup.ref('currentPassword')], 'Mật khẩu mới phải khác mật khẩu hiện tại')
    .required('Vui lòng nhập mật khẩu mới'),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu mới'),
});

export default function ChangePasswordPage() {
  const firstLogin = useAuthStore((s) => s.firstLogin);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const addToast = useUiStore((s) => s.addToast);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authApi.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      setIsRedirecting(true);
      reset();
      
      addToast({
        type: 'success',
        message: 'Mật khẩu đã được cập nhật thành công. Hệ thống sẽ chuyển về trang đăng nhập sau 5 giây...',
        duration: 5000,
      });
      
      // Khóa luồng clearAuth và redirect vào bên trong setTimeout để bảo toàn UI hiện tại
      setTimeout(() => {
        clearAuth();
        window.location.replace('/login');
      }, 5000);
      
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400) {
        const message = err?.response?.data?.message ?? 'Mật khẩu hiện tại không đúng.';
        setError('currentPassword', { type: 'server', message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderEyeIcon = (show, toggle) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
      tabIndex="-1"
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="p-8">
      <div className="max-w-lg">
        {firstLogin && (
          <div className="mb-6 rounded-md bg-blue-50 border border-blue-200 px-4 py-3">
            <p className="text-sm font-semibold text-blue-800">
              Yêu cầu đổi mật khẩu lần đầu
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Đây là lần đầu bạn đăng nhập vào hệ thống. Vui lòng thay đổi mật khẩu
              trước khi tiếp tục sử dụng.
            </p>
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900">Đổi mật khẩu</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mật khẩu mới phải có ít nhất 8 ký tự.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-6 space-y-5 bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
        >
          {/* Current password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="currentPassword" className="text-sm font-semibold text-gray-700">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isRedirecting}
                {...register('currentPassword')}
                className={`w-full h-11 rounded-md border pl-4 pr-10 text-sm outline-none
                            transition duration-200 focus:ring-2 focus:ring-[#1a5ea8]/20
                            ${errors.currentPassword
                              ? 'border-red-400'
                              : 'border-gray-300 hover:border-gray-400 focus:border-[#1a5ea8]'
                            } disabled:bg-gray-50 disabled:text-gray-400`}
              />
              {!isRedirecting && renderEyeIcon(showCurrentPassword, () => setShowCurrentPassword(!showCurrentPassword))}
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                disabled={isRedirecting}
                {...register('newPassword')}
                className={`w-full h-11 rounded-md border pl-4 pr-10 text-sm outline-none
                            transition duration-200 focus:ring-2 focus:ring-[#1a5ea8]/20
                            ${errors.newPassword
                              ? 'border-red-400'
                              : 'border-gray-300 hover:border-gray-400 focus:border-[#1a5ea8]'
                            } disabled:bg-gray-50 disabled:text-gray-400`}
              />
              {!isRedirecting && renderEyeIcon(showNewPassword, () => setShowNewPassword(!showNewPassword))}
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-500">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm new password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmNewPassword" className="text-sm font-semibold text-gray-700">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="confirmNewPassword"
                type={showConfirmNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={isRedirecting}
                {...register('confirmNewPassword')}
                className={`w-full h-11 rounded-md border pl-4 pr-10 text-sm outline-none
                            transition duration-200 focus:ring-2 focus:ring-[#1a5ea8]/20
                            ${errors.confirmNewPassword
                              ? 'border-red-400'
                              : 'border-gray-300 hover:border-gray-400 focus:border-[#1a5ea8]'
                            } disabled:bg-gray-50 disabled:text-gray-400`}
              />
              {!isRedirecting && renderEyeIcon(showConfirmNewPassword, () => setShowConfirmNewPassword(!showConfirmNewPassword))}
            </div>
            {errors.confirmNewPassword && (
              <p className="text-xs text-red-500">{errors.confirmNewPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || isRedirecting}
            className="w-full h-11 rounded-md bg-[#1a3a7c] hover:bg-[#15306a] text-white
                       font-bold text-sm tracking-wide transition duration-200
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRedirecting ? 'Đang chuyển hướng...' : isLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}