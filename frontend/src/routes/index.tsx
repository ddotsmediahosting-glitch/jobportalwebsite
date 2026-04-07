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
const AboutUs = lazy(() => import('../pages/public/AboutUs').then((m) => ({ default: m.AboutUs })));
const ContactUs = lazy(() => import('../pages/public/ContactUs').then((m) => ({ default: m.ContactUs })));
const CareerServices = lazy(() => import('../pages/public/CareerServices').then((m) => ({ default: m.CareerServices })));
const Companies = lazy(() => import('../pages/public/Companies').then((m) => ({ default: m.Companies })));
const CompanyDetail = lazy(() => import('../pages/public/CompanyDetail').then((m) => ({ default: m.CompanyDetail })));
const NotificationsPage = lazy(() => import('../pages/public/Notifications').then((m) => ({ default: m.NotificationsPage })));
const SalaryExplorer = lazy(() => import('../pages/public/SalaryExplorer').then((m) => ({ default: m.SalaryExplorer })));
const TrendingJobs = lazy(() => import('../pages/public/TrendingJobs').then((m) => ({ default: m.TrendingJobs })));
const ApplicationTracker = lazy(() => import('../pages/public/ApplicationTracker').then((m) => ({ default: m.ApplicationTracker })));
const MarketInsights = lazy(() => import('../pages/public/MarketInsights').then((m) => ({ default: m.MarketInsights })));
const CareerScore = lazy(() => import('../pages/public/CareerScore').then((m) => ({ default: m.CareerScore })));
const MockInterview = lazy(() => import('../pages/public/MockInterview').then((m) => ({ default: m.MockInterview })));

// Seeker pages
const SeekerDashboard = lazy(() => import('../pages/public/SeekerDashboard').then((m) => ({ default: m.SeekerDashboard })));
const Profile = lazy(() => import('../pages/public/Profile').then((m) => ({ default: m.Profile })));
const MyApplications = lazy(() => import('../pages/public/MyApplications').then((m) => ({ default: m.MyApplications })));
const SavedJobs = lazy(() => import('../pages/public/SavedJobs').then((m) => ({ default: m.SavedJobs })));
const JobAlerts = lazy(() => import('../pages/public/JobAlerts').then((m) => ({ default: m.JobAlerts })));
const PostJobAsUser = lazy(() => import('../pages/public/PostJobAsUser').then((m) => ({ default: m.PostJobAsUser })));
const MyPosts = lazy(() => import('../pages/public/MyPosts').then((m) => ({ default: m.MyPosts })));

// CV / ATS pages
const CVAnalyzer = lazy(() => import('../pages/cv/CVAnalyzer').then((m) => ({ default: m.CVAnalyzer })));
const CVBuilder = lazy(() => import('../pages/cv/CVBuilder').then((m) => ({ default: m.CVBuilder })));

// AI pages
const CareerAdvisor = lazy(() => import('../pages/ai/CareerAdvisor').then((m) => ({ default: m.CareerAdvisor })));
const SalaryInsights = lazy(() => import('../pages/ai/SalaryInsights').then((m) => ({ default: m.SalaryInsights })));
const InterviewPrep = lazy(() => import('../pages/ai/InterviewPrep').then((m) => ({ default: m.InterviewPrep })));
const TrendingSkills = lazy(() => import('../pages/ai/TrendingSkills').then((m) => ({ default: m.TrendingSkills })));
const ProfileCoach = lazy(() => import('../pages/ai/ProfileCoach').then((m) => ({ default: m.ProfileCoach })));
const EmployerAIInsights = lazy(() => import('../pages/employer/AIInsights').then((m) => ({ default: m.EmployerAIInsights })));

// Employer pages
const EmployerDashboard = lazy(() => import('../pages/employer/Dashboard').then((m) => ({ default: m.EmployerDashboard })));
const PostJob = lazy(() => import('../pages/employer/PostJob').then((m) => ({ default: m.PostJob })));
const ManageJobs = lazy(() => import('../pages/employer/ManageJobs').then((m) => ({ default: m.ManageJobs })));
const ApplicationsPipeline = lazy(() => import('../pages/employer/ApplicationsPipeline').then((m) => ({ default: m.ApplicationsPipeline })));
const CompanyProfile = lazy(() => import('../pages/employer/CompanyProfile').then((m) => ({ default: m.CompanyProfile })));
const Team = lazy(() => import('../pages/employer/Team').then((m) => ({ default: m.Team })));
const EmployerAnalyticsPage = lazy(() => import('../pages/employer/Analytics').then((m) => ({ default: m.EmployerAnalyticsPage })));
const CandidateSearch = lazy(() => import('../pages/employer/CandidateSearch').then((m) => ({ default: m.CandidateSearch })));
const InterviewScheduler = lazy(() => import('../pages/employer/InterviewScheduler').then((m) => ({ default: m.InterviewScheduler })));

// Admin login
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));

// Admin pages
const AdminBlogManager = lazy(() => import('../pages/admin/BlogManager').then((m) => ({ default: m.AdminBlogManager })));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminAnalytics = lazy(() => import('../pages/admin/Analytics').then((m) => ({ default: m.AdminAnalytics })));
const AdminUsers = lazy(() => import('../pages/admin/Users').then((m) => ({ default: m.AdminUsers })));
const AdminEmployers = lazy(() => import('../pages/admin/Employers').then((m) => ({ default: m.AdminEmployers })));
const AdminJobs = lazy(() => import('../pages/admin/Jobs').then((m) => ({ default: m.AdminJobs })));
const AdminCategories = lazy(() => import('../pages/admin/Categories').then((m) => ({ default: m.AdminCategories })));
const AdminReports = lazy(() => import('../pages/admin/Reports').then((m) => ({ default: m.AdminReports })));
const AdminSubscriptions = lazy(() => import('../pages/admin/Subscriptions').then((m) => ({ default: m.AdminSubscriptions })));
const AdminMarketing = lazy(() => import('../pages/admin/Marketing').then((m) => ({ default: m.AdminMarketing })));
const AdminWhatsAppBot = lazy(() => import('../pages/admin/WhatsAppBot').then((m) => ({ default: m.AdminWhatsAppBot })));
const AdminWhatsAppLinks = lazy(() => import('../pages/admin/WhatsAppLinks').then((m) => ({ default: m.AdminWhatsAppLinks })));
const AdminAuditLogs = lazy(() => import('../pages/admin/AuditLogs').then((m) => ({ default: m.AdminAuditLogs })));
const AdminSettings = lazy(() => import('../pages/admin/Settings').then((m) => ({ default: m.AdminSettings })));
const WhatsAppGroupsPage = lazy(() => import('../pages/public/WhatsAppGroups').then((m) => ({ default: m.WhatsAppGroups })));
const CommunityPage = lazy(() => import('../pages/public/Community').then((m) => ({ default: m.Community })));
const CommunityPostPage = lazy(() => import('../pages/public/CommunityPost').then((m) => ({ default: m.CommunityPost })));
const AdminCommunityPage = lazy(() => import('../pages/admin/Community').then((m) => ({ default: m.AdminCommunity })));

// Employer - Social Marketing
const SocialMarketing = lazy(() => import('../pages/employer/SocialMarketing').then((m) => ({ default: m.SocialMarketing })));

// Short link redirect
const ShortRedirect = lazy(() => import('../pages/public/ShortRedirect').then((m) => ({ default: m.ShortRedirect })));

// 404
const NotFound = lazy(() => import('../pages/public/NotFound').then((m) => ({ default: m.NotFound })));

// Social OAuth callback
const SocialCallback = lazy(() => import('../pages/public/SocialCallback').then((m) => ({ default: m.SocialCallback })));

function RequireAuth({ children, roles }: { children: React.ReactElement; roles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated) {
    // Send admin routes to admin login, others to regular login
    const isAdminRoute = location.pathname.startsWith('/admin');
    return <Navigate to={isAdminRoute ? '/admin/login' : '/login'} state={{ from: location }} replace />;
  }
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function GuestOnly({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (isAuthenticated) {
    if (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function AdminGuestOnly({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUB_ADMIN')) {
    return <Navigate to="/admin/dashboard" replace />;
  }
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
          <Route path="about" element={<AboutUs />} />
          <Route path="contact" element={<ContactUs />} />
          <Route path="career-services" element={<CareerServices />} />
          <Route path="login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="forgot-password" element={<GuestOnly><ForgotPassword /></GuestOnly>} />
          <Route path="reset-password" element={<GuestOnly><ResetPassword /></GuestOnly>} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="seeker-dashboard" element={<RequireAuth roles={['SEEKER']}><SeekerDashboard /></RequireAuth>} />
          <Route path="profile" element={<RequireAuth roles={['SEEKER']}><Profile /></RequireAuth>} />
          <Route path="my-applications" element={<RequireAuth roles={['SEEKER']}><MyApplications /></RequireAuth>} />
          <Route path="saved-jobs" element={<RequireAuth roles={['SEEKER']}><SavedJobs /></RequireAuth>} />
          <Route path="companies" element={<Companies />} />
          <Route path="companies/:slug" element={<CompanyDetail />} />
          <Route path="cv-analyzer" element={<RequireAuth><CVAnalyzer /></RequireAuth>} />
          <Route path="cv-builder" element={<RequireAuth><CVBuilder /></RequireAuth>} />
          <Route path="career-advisor" element={<CareerAdvisor />} />
          <Route path="salary-insights" element={<SalaryInsights />} />
          <Route path="interview-prep" element={<InterviewPrep />} />
          <Route path="trending-skills" element={<TrendingSkills />} />
          <Route path="profile-coach" element={<RequireAuth roles={['SEEKER']}><ProfileCoach /></RequireAuth>} />
          <Route path="job-alerts" element={<RequireAuth roles={['SEEKER']}><JobAlerts /></RequireAuth>} />
          <Route path="notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
          <Route path="salary-explorer" element={<SalaryExplorer />} />
          <Route path="trending" element={<TrendingJobs />} />
          <Route path="market-insights" element={<MarketInsights />} />
          <Route path="career-score" element={<CareerScore />} />
          <Route path="mock-interview" element={<MockInterview />} />
          <Route path="application-tracker" element={<RequireAuth roles={['SEEKER']}><ApplicationTracker /></RequireAuth>} />
          <Route path="post-job" element={<RequireAuth><PostJobAsUser /></RequireAuth>} />
          <Route path="my-posts" element={<RequireAuth><MyPosts /></RequireAuth>} />
          <Route path="whatsapp-groups" element={<WhatsAppGroupsPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="community/:id" element={<CommunityPostPage />} />
          <Route path="social-callback" element={<SocialCallback />} />
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
          <Route path="team" element={<Team />} />
          <Route path="social-marketing" element={<SocialMarketing />} />
          <Route path="analytics" element={<EmployerAnalyticsPage />} />
          <Route path="candidates" element={<CandidateSearch />} />
          <Route path="interviews" element={<InterviewScheduler />} />
          <Route path="ai-insights" element={<EmployerAIInsights />} />
        </Route>

        {/* Admin login — separate from public login */}
        <Route path="/admin/login" element={<AdminGuestOnly><AdminLogin /></AdminGuestOnly>} />

        {/* Admin routes */}
        <Route path="/admin" element={<RequireAuth roles={['ADMIN', 'SUB_ADMIN']}><AdminLayout /></RequireAuth>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="employers" element={<AdminEmployers />} />
          <Route path="jobs" element={<AdminJobs />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="marketing" element={<AdminMarketing />} />
          <Route path="whatsapp-bot" element={<AdminWhatsAppBot />} />
          <Route path="whatsapp-links" element={<AdminWhatsAppLinks />} />
          <Route path="community" element={<AdminCommunityPage />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="blog" element={<AdminBlogManager />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Short link redirect — no layout needed */}
        <Route path="s/:shortCode" element={<ShortRedirect />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
