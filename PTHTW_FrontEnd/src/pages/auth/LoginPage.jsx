import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useLocation } from 'react-router-dom';
import bgBuilding from '../../assets/ADMIN/bg-building.svg';
import logoOU from '../../assets/ADMIN/logo-ou.svg';
import { authApi } from '../../api/auth.api';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import {
  resolvePostLoginDestination,
  hardNavigateAfterAuth,
} from '../../utils/postLoginNavigation';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Email không đúng định dạng')
    .required('Vui lòng nhập email'),
  password: yup
    .string()
    .required('Vui lòng nhập mật khẩu'),
});

export default function LoginPage() {
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const addToast = useUiStore((s) => s.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onSubmit',
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.login({ email: data.email, password: data.password });
      const payload = response.data;
      const token = payload.token;
      const refreshToken = payload.refreshToken;
      const email = payload.email;
      const fullName = payload.fullName;
      const firstLogin = payload.firstLogin;
      const systemRole = payload.systemRole ?? payload.role;

      setAuth({
        token,
        refreshToken,
        userClaims: { email, fullName, role: systemRole, systemRole, firstLogin },
      });

      if (firstLogin) {
        hardNavigateAfterAuth('/change-password');
        return;
      }

      const from = location.state?.from?.pathname;
      const destination = resolvePostLoginDestination(systemRole, from);
      hardNavigateAfterAuth(destination);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('password', {
          type: 'server',
          message: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
        });
        setValue('password', '');
      } else if (status === 423) {
        addToast({ type: 'error', message: err?.response?.data?.message ?? 'Tài khoản đang bị khóa.' });
        setError('email', { type: 'server', message: 'Tài khoản đang bị khóa.' });
      } else if (status === 400) {
        const serverErrors = err?.response?.data?.errors ?? [];
        if (Array.isArray(serverErrors)) {
          serverErrors.forEach(({ field, message }) => {
            if (field === 'email' || field === 'password') {
              setError(field, { type: 'server', message });
            }
          });
        }
        if (serverErrors.length === 0) {
          addToast({ type: 'error', message: err?.response?.data?.message ?? 'Đăng nhập thất bại.' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left panel — building photo */}
      <div className="hidden md:block w-1/2 h-full flex-shrink-0">
        <img
          src={bgBuilding}
          alt="OU Building"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 bg-[#9BD3F1]">
        <div className="w-full max-w-[360px] rounded-2xl bg-white
                        shadow-[0_8px_40px_rgba(0,0,0,0.13)]
                        px-10 pt-9 pb-7 flex flex-col items-center gap-5">
          {/* Branding */}
          <div className="flex flex-col items-center gap-3">
            <img src={logoOU} alt="OU Logo" className="h-[88px] w-auto object-contain" />
            <div className="text-center leading-snug">
              <p className="text-[12.5px] font-bold text-[#1a5ea8] uppercase tracking-wider">
                Trường Đại học Mở TP. Hồ Chí Minh
              </p>
              <p className="text-[9.5px] font-medium text-[#4a90c4] uppercase tracking-[0.18em] mt-0.5">
                Ho Chi Minh City Open University
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mt-1">
            <h1 className="text-[19px] font-bold text-gray-900 leading-tight">Đăng nhập</h1>
            <p className="text-[15px] font-bold text-[#1a5ea8] mt-2 tracking-wide">
              Hệ thống Xét duyệt Nghiên cứu Khoa học
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="w-full flex flex-col gap-4 mt-1"
          >
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-bold text-gray-700 tracking-wide"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Nhập địa chỉ email"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
                className={`w-full h-11 rounded-md border px-4 text-sm text-gray-800
                            placeholder-gray-400 outline-none transition duration-200
                            focus:ring-2 focus:ring-[#1a5ea8]/20
                            ${errors.email
                              ? 'border-red-400 focus:border-red-400'
                              : 'border-gray-300 hover:border-gray-400 focus:border-[#1a5ea8]'
                            }`}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-500 mt-0.5" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-bold text-gray-700 tracking-wide"
              >
                Mật khẩu
              </label>
              <div className="relative w-full">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                  className={`w-full h-11 rounded-md border px-4 pr-10 text-sm text-gray-800
                              placeholder-gray-400 outline-none transition duration-200
                              focus:ring-2 focus:ring-[#1a5ea8]/20
                              ${errors.password
                                ? 'border-red-400 focus:border-red-400'
                                : 'border-gray-300 hover:border-gray-400 focus:border-[#1a5ea8]'
                              }`}
                />
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-red-500 mt-0.5" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-1 rounded-md bg-[#1a3a7c] hover:bg-[#15306a]
                         active:bg-[#112960] text-white font-bold text-[15px] tracking-wide
                         transition duration-200 shadow-sm disabled:opacity-60
                         disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Forgot password */}
          <Link
            to="/forgot-password"
            className="text-[13px] text-gray-500 underline underline-offset-2
                       hover:text-[#1a5ea8] transition duration-150"
          >
            Quên mật khẩu?
          </Link>

          <div className="w-full border-t border-gray-100 mt-1" />

          {/* Footer */}
          <p className="text-[10px] text-gray-400 text-center leading-relaxed -mt-1">
            Bản quyền © 2026 Trường Đại học Mở TP.HCM
            <br />
            Hỗ trợ:{' '}
            <a
              href="mailto:phongqlkh@ou.edu.vn"
              className="hover:text-[#1a5ea8] transition duration-150"
            >
              phongqlkh@ou.edu.vn
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}