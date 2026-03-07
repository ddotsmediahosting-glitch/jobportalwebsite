import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PublicLayout } from '../components/layout/PublicLayout';
import { EmployerLayout } from '../components/layout/EmployerLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { PageSpinner } from '../components/ui/Spinner';

// Public pages
const Home = lazy(() => import('../pages/public/Home').then((m) => ({ default: m.Home })));
const Jobs = lazy(() => import('../pages/public/Jobs').then((m) => ({ default: m.Jobs })));
const JobDetail = lazy(() => import('../pages/public/JobDetail').then((m) => ({ default: m.JobDetail })));
const Login = lazy(() => import('../pages/public/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('../pages/public/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('../pages/public/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('../pages/public/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const VerifyEmail = lazy(() => import('../pages/public/VerifyEmail').then((m) => ({ default: m.VerifyEmail })));
const ContentPage = lazy(() => import('../pages/public/ContentPage').then((m) => ({ default: m.ContentPage })));

// Seeker pages
const Profile = lazy(() => import('../pages/public/Profile').then((m) => ({ default: m.Profile })));
const MyApplications = lazy(() => import('../pages/public/MyApplications').then((m) => ({ default: m.MyApplications })));
const SavedJobs = lazy(() => import('../pages/public/SavedJobs').then((m) => ({ default: m.SavedJobs })));

// CV / ATS pages
const CVAnalyzer = lazy(() => import('../pages/cv/CVAnalyzer').then((m) => ({ default: m.CVAnalyzer })));
const CVBuilder = lazy(() => import('../pages/cv/CVBuilder').then((m) => ({ default: m.CVBuilder })));

// Employer pages
const EmployerDashboard = lazy(() => import('../pages/employer/Dashboard').then((m) => ({ default: m.EmployerDashboard })));
const PostJob = lazy(() => import('../pages/employer/PostJob').then((m) => ({ default: m.PostJob })));
const ManageJobs = lazy(() => import('../pages/employer/ManageJobs').then((m) => ({ default: m.ManageJobs })));
const ApplicationsPipeline = lazy(() => import('../pages/employer/ApplicationsPipeline').then((m) => ({ default: m.ApplicationsPipeline })));
const CompanyProfile = lazy(() => import('../pages/employer/CompanyProfile').then((m) => ({ default: m.CompanyProfile })));
const Billing = lazy(() => import('../pages/employer/Billing').then((m) => ({ default: m.Billing })));
const Team = lazy(() => import('../pages/employer/Team').then((m) => ({ default: m.Team })));

// Admin pages
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminUsers = lazy(() => import('../pages/admin/Users').then((m) => ({ default: m.AdminUsers })));
const AdminEmployers = lazy(() => import('../pages/admin/Employers').then((m) => ({ default: m.AdminEmployers })));
const AdminJobs = lazy(() => import('../pages/admin/Jobs').then((m) => ({ default: m.AdminJobs })));
const AdminCategories = lazy(() => import('../pages/admin/Categories').then((m) => ({ default: m.AdminCategories })));
const AdminReports = lazy(() => import('../pages/admin/Reports').then((m) => ({ default: m.AdminReports })));
const AdminAuditLogs = lazy(() => import('../pages/admin/AuditLogs').then((m) => ({ default: m.AdminAuditLogs })));
const AdminSettings = lazy(() => import('../pages/admin/Settings').then((m) => ({ default: m.AdminSettings })));

function RequireAuth({ children, roles }: { children: React.ReactElement; roles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function GuestOnly({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:slug" element={<JobDetail />} />
          <Route path="pages/:slug" element={<ContentPage />} />
          <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
          <Route path="reset-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="profile" element={<RequireAuth roles={['SEEKER']}><Profile /></RequireAuth>} />
          <Route path="my-applications" element={<RequireAuth roles={['SEEKER']}><MyApplications /></RequireAuth>} />
          <Route path="saved-jobs" element={<RequireAuth roles={['SEEKER']}><SavedJobs /></RequireAuth>} />
          <Route path="cv-analyzer" element={<RequireAuth><CVAnalyzer /></RequireAuth>} />
          <Route path="cv-builder" element={<RequireAuth><CVBuilder /></RequireAuth>} />
        </Route>

        {/* Employer routes */}
        <Route path="/employer" element={<RequireAuth roles={['EMPLOYER']}><EmployerLayout /></RequireAuth>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<EmployerDashboard />} />
          <Route path="jobs" element={<ManageJobs />} />
          <Route path="jobs/new" element={<PostJob />} />
          <Route path="jobs/:id/edit" element={<PostJob />} />
          <Route path="applications" element={<ApplicationsPipeline />} />
          <Route path="company" element={<CompanyProfile />} />
          <Route path="billing" element={<Billing />} />
          <Route path="team" element={<Team />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<RequireAuth roles={['ADMIN', 'SUB_ADMIN']}><AdminLayout /></RequireAuth>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="employers" element={<AdminEmployers />} />
          <Route path="jobs" element={<AdminJobs />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
