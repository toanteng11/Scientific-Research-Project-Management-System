import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import useUiStore from '../../store/uiStore';

const schema = yup.object({
  newPassword: yup
    .string()
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .max(128, 'Mật khẩu mới không được vượt quá 128 ký tự')
    .required('Vui lòng nhập mật khẩu mới'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu mới'),
});

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token') ?? '';
  const addToast = useUiStore((s) => s.addToast);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [tokenError, setTokenError] = useState(null);

  // Visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data) => {
    if (!resetToken) {
      setTokenError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.resetPassword({ token: resetToken, newPassword: data.newPassword });
      
      setIsRedirecting(true);
      addToast({ 
        type: 'success', 
        message: 'Mật khẩu đã được đặt lại thành công. Sẽ chuyển về trang đăng nhập sau 5 giây...',
        duration: 5000 
      });
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 5000);
      
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setTokenError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại.');
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

  if (!resetToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px] rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.10)]
                        px-8 py-8 text-center">
          <p className="text-sm text-red-600 font-semibold">
            Liên kết đặt lại mật khẩu không hợp lệ.
          </p>
          <Link to="/forgot-password" className="mt-4 block text-sm text-[#1a5ea8] hover:underline">
            Yêu cầu liên kết mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-[400px] rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.10)]
                      px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        </div>

        {tokenError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {tokenError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                disabled={isRedirecting}
                {...register('confirmPassword')}
                className={`w-full h-11 rounded-md border pl-4 pr-10 text-sm outline-none
                            transition duration-200 focus:ring-2 focus:ring-[#1a5ea8]/20
                            ${errors.confirmPassword
                              ? 'border-red-400'
                              : 'border-gray-300 hover:border-gray-400 focus:border-[#1a5ea8]'
                            } disabled:bg-gray-50 disabled:text-gray-400`}
              />
              {!isRedirecting && renderEyeIcon(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || isRedirecting}
            className="w-full h-11 rounded-md bg-[#1a3a7c] hover:bg-[#15306a] text-white
                       font-bold text-sm tracking-wide transition duration-200
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRedirecting ? 'Đang chuyển hướng...' : isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-[#1a5ea8] transition duration-150">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}