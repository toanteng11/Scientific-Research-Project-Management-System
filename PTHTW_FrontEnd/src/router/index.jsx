/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { ROLE_DASHBOARD } from '../utils/postLoginNavigation';

// ── Layout shell ─────────────────────────────────────────────────────────────
import AppShell from '../components/layout/AppShell';

// ── RBAC guard ────────────────────────────────────────────────────────────────
import PrivateRoute from '../components/guards/PrivateRoute';

// ── Error boundaries ──────────────────────────────────────────────────────────
import ForbiddenPage from '../components/error/ForbiddenPage';
import ConflictPage from '../components/error/ConflictPage';
import ServerErrorPage from '../components/error/ServerErrorPage';
import QuotaExceededPage from '../components/error/QuotaExceededPage';
import NotFoundPage from '../components/error/NotFoundPage';

// ── Public / Auth pages (Phase 4) ────────────────────────────────────────────
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// ── Authenticated pages — All roles ──────────────────────────────────────────
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';
import NotificationInboxPage from '../pages/auth/NotificationInboxPage';
import UserProfilePage from '../pages/profile/UserProfilePage';

// ── RESEARCHER ────────────────────────────────────────────────────────────────
import ResearcherDashboardPage from '../pages/researcher/ResearcherDashboardPage';
import TopicSubmissionWizardPage from '../pages/researcher/TopicSubmissionWizardPage';
import TopicDetailPage from '../pages/researcher/TopicDetailPage';
import TopicRevisionFormPage from '../pages/researcher/TopicRevisionFormPage';

// ── DEPT_HEAD ─────────────────────────────────────────────────────────────────
import DepartmentDashboardPage from '../pages/department/DepartmentDashboardPage';
import DeptTopicDetailPage from '../pages/department/DeptTopicDetailPage';

// ── MANAGER ───────────────────────────────────────────────────────────────────
import SciManDashboardPage from '../pages/manager/SciManDashboardPage';
import AllTopicsListPage from '../pages/manager/AllTopicsListPage';
import ManagerTopicDetailPage from '../pages/manager/ManagerTopicDetailPage';
import CouncilManagementPage from '../pages/manager/CouncilManagementPage';
import CouncilCreatePage from '../pages/manager/CouncilCreatePage';
import CouncilDetailPage from '../pages/manager/CouncilDetailPage';
import StatsDashboardPage from '../pages/manager/StatsDashboardPage';

// ── COUNCIL ───────────────────────────────────────────────────────────────────
import CouncilMemberDashboardPage from '../pages/council/CouncilMemberDashboardPage';
import EvaluationFormPage from '../pages/council/EvaluationFormPage';
import CouncilMinutesFormPage from '../pages/council/CouncilMinutesFormPage';
import CouncilSecretarySessionPage from '../pages/council/CouncilSecretarySessionPage';
import PresidentWorkspacePage from '../pages/council/PresidentWorkspacePage';

// ── ADMIN ─────────────────────────────────────────────────────────────────────
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import EmailTemplatePreviewerPage from '../pages/admin/EmailTemplatePreviewerPage';
import AccountManagementPage from '../pages/admin/AccountManagementPage';
import CreateUserPage from '../pages/admin/CreateUserPage';

/**
 * RootRedirect — Contextual index route handler.
 *
 * Resolves the `/` path based on authentication state and role:
 * - Unauthenticated → /login
 * - firstLogin === true → /change-password
 * - Authenticated → role-appropriate dashboard
 *
 * This component is rendered inside AppShell (layout route) and
 * does NOT require an additional PrivateRoute wrapper because it
 * handles all auth states internally.
 */
function RootRedirect() {
  const token = useAuthStore((s) => s.token);
  const firstLogin = useAuthStore((s) => s.firstLogin);
  const role = useAuthStore((s) => s.getRole());

  if (!token) return <Navigate to="/login" replace />;
  if (firstLogin) return <Navigate to="/change-password" replace />;

  return <Navigate to={ROLE_DASHBOARD[role] ?? '/login'} replace />;
}

/**
 * router — Central React Router v7 browser router.
 *
 * Architecture: Pathless layout route pattern.
 * - AppShell renders Sidebar + TopBar + <Outlet /> for all authenticated routes.
 * - PrivateRoute is used as a pathless route element to group routes by role.
 * - Public routes (login, forgot/reset password, error pages) bypass AppShell.
 *
 * Route count: 36 client-side routes as mandated in the Audit Report § Part 1.
 *
 * Guard layers (all authenticated routes):
 * Layer 1 — Token check (PrivateRoute): unauthenticated → /login
 * Layer 2 — firstLogin check (PrivateRoute): firstLogin → /change-password
 * [Exception: /change-password uses skipFirstLoginCheck]
 * Layer 3 — RBAC (PrivateRoute.allowedRoles): role mismatch → <ForbiddenPage />
 */
const router = createBrowserRouter([

  // ── PUBLIC ROUTES (no AppShell, no auth required) ──────────────────────────
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // ── ERROR BOUNDARY ROUTES (standalone, no AppShell) ───────────────────────
  // These are navigated to by the Axios response interceptor and rendered
  // without the authenticated shell to ensure accessibility even during
  // broken auth states.
  {
    path: '/error/402',
    element: <QuotaExceededPage />,
  },
  {
    path: '/error/403',
    element: <ForbiddenPage />,
  },
  {
    path: '/error/409',
    element: <ConflictPage />,
  },
  {
    path: '/error/500',
    element: <ServerErrorPage />,
  },

  // ── AUTHENTICATED ROUTES (AppShell layout) ────────────────────────────────
  {
    element: <AppShell />,
    children: [

      // ── Root index: context-sensitive redirect ──────────────────────────
      {
        path: '/',
        element: <RootRedirect />,
      },

      // ── Change Password: auth required, firstLogin redirect BYPASSED ────
      // Must be declared BEFORE the generic authenticated group to prevent
      // a firstLogin=true user being caught in a redirect loop.
      {
        element: <PrivateRoute allowedRoles={[]} skipFirstLoginCheck />,
        children: [
          {
            path: '/change-password',
            element: <ChangePasswordPage />,
          },
        ],
      },

      // ── All authenticated roles (subject to firstLogin redirect) ────────
      {
        element: <PrivateRoute allowedRoles={[]} />,
        children: [
          {
            path: '/profile',
            element: <UserProfilePage />,
          },
          {
            path: '/notifications',
            element: <NotificationInboxPage />,
          },
        ],
      },

      // ── RESEARCHER ──────────────────────────────────────────────────────
      {
        element: <PrivateRoute allowedRoles={['RESEARCHER']} />,
        children: [
          { path: '/researcher/dashboard', element: <ResearcherDashboardPage /> },
          { path: '/researcher/topics/new', element: <TopicSubmissionWizardPage /> },
          { path: '/researcher/topics/:topicId', element: <TopicDetailPage /> },
          { path: '/researcher/topics/:topicId/revise', element: <TopicRevisionFormPage /> },
        ],
      },

      // ── DEPT_HEAD ───────────────────────────────────────────────────────
      {
        element: <PrivateRoute allowedRoles={['DEPT_HEAD']} />,
        children: [
          { path: '/department/dashboard', element: <DepartmentDashboardPage /> },
          { path: '/department/topics/:topicId', element: <DeptTopicDetailPage /> },
        ],
      },

      // ── MANAGER ─────────────────────────────────────────────────────────
      {
        element: <PrivateRoute allowedRoles={['MANAGER']} />,
        children: [
          { path: '/manager/dashboard', element: <SciManDashboardPage /> },
          { path: '/manager/topics', element: <AllTopicsListPage /> },
          { path: '/manager/topics/:topicId', element: <ManagerTopicDetailPage /> },
          { path: '/manager/councils', element: <CouncilManagementPage /> },
          { path: '/manager/councils/new', element: <CouncilCreatePage /> },
          { path: '/manager/councils/:councilId', element: <CouncilDetailPage /> },
          { path: '/manager/stats', element: <StatsDashboardPage /> },
          { path: '/manager/email-templates', element: <EmailTemplatePreviewerPage /> },
        ],
      },

      // ── COUNCIL ─────────────────────────────────────────────────────────
      {
        element: <PrivateRoute allowedRoles={['COUNCIL']} />,
        children: [
          { path: '/council/dashboard', element: <CouncilMemberDashboardPage /> },
          { path: '/council/topics/:topicId/session', element: <CouncilSecretarySessionPage /> },
          { path: '/council/topics/:topicId/president', element: <PresidentWorkspacePage /> },
          { path: '/council/topics/:topicId/evaluate', element: <EvaluationFormPage /> },
          { path: '/council/topics/:topicId/minute', element: <CouncilMinutesFormPage /> },
        ],
      },

      // ── ADMIN ────────────────────────────────────────────────────────────
      {
        element: <PrivateRoute allowedRoles={['ADMIN']} />,
        children: [
          { path: '/admin/dashboard', element: <AdminDashboardPage /> },
          { path: '/admin/users', element: <AccountManagementPage /> },
          { path: '/admin/users/new/:role', element: <CreateUserPage /> },
          { path: '/admin/stats', element: <StatsDashboardPage /> },
          { path: '/admin/email-templates', element: <EmailTemplatePreviewerPage /> },
        ],
      },
    ],
  },

  // ── CATCH-ALL (standalone, no AppShell) ───────────────────────────────────
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;