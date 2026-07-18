import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

const schema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Email không đúng định dạng')
    .required('Vui lòng nhập email'),
});

/**
 * ForgotPasswordPage — Password recovery request form.
 *
 * Route: /forgot-password (public)
 *
 * Calls POST /api/v1/auth/forgot-password with { email }.
 * The backend always returns 204 regardless of whether the account exists
 * (idempotent by design to prevent email enumeration attacks).
 *
 * On 204: renders a confirmation banner.
 * On 400: surfaces field-level error from server validation.
 */
export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: data.email.trim() });
      setSubmitted(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400) {
        const serverErrors = err?.response?.data?.errors ?? [];
        serverErrors.forEach(({ field, message }) => {
          if (field === 'email') setError('email', { type: 'server', message });
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-[400px] rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.10)]
                      px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Nhập địa chỉ email đã đăng ký. Nếu tài khoản tồn tại, hệ thống sẽ gửi
            liên kết khôi phục mật khẩu.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-800">
            <p className="font-semibold">Email khôi phục đã được gửi.</p>
            <p className="mt-1">
              Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn trong email.
              Liên kết có hiệu lực trong 30 phút.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Địa chỉ email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="example@ou.edu.vn"
                {...register('email')}
                className={`w-full h-11 rounded-md border px-4 text-sm outline-none
                            transition duration-200 focus:ring-2 focus:ring-[#1a5ea8]/20
                            ${errors.email
                              ? 'border-red-400 focus:border-red-400'
                              : 'border-gray-300 hover:border-gray-400 focus:border-[#1a5ea8]'
                            }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-md bg-[#1a3a7c] hover:bg-[#15306a] text-white
                         font-bold text-sm tracking-wide transition duration-200
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-gray-500 hover:text-[#1a5ea8] transition duration-150"
          >
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
