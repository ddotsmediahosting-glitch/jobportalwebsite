import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { RoleGuard } from "../components/RoleGuard";
import { HomePage } from "../pages/HomePage";
import { JobsPage } from "../pages/JobsPage";
import { JobDetailPage } from "../pages/JobDetailPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ResumePage } from "../pages/ResumePage";
import { ApplicationsPage } from "../pages/ApplicationsPage";
import { SavedJobsPage } from "../pages/SavedJobsPage";
import { EmployerDashboardPage } from "../pages/EmployerDashboardPage";
import { CompanyProfilePage } from "../pages/CompanyProfilePage";
import { PostJobPage } from "../pages/PostJobPage";
import { ManageJobsPage } from "../pages/ManageJobsPage";
import { PipelinePage } from "../pages/PipelinePage";
import { BillingPage } from "../pages/BillingPage";
import { TeamMembersPage } from "../pages/TeamMembersPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { AdminUsersPage } from "../pages/AdminUsersPage";
import { AdminEmployerVerificationPage } from "../pages/AdminEmployerVerificationPage";
import { AdminJobsModerationPage } from "../pages/AdminJobsModerationPage";
import { AdminCategoriesPage } from "../pages/AdminCategoriesPage";
import { AdminReportsPage } from "../pages/AdminReportsPage";
import { AdminSettingsPage } from "../pages/AdminSettingsPage";
import { AdminAuditLogsPage } from "../pages/AdminAuditLogsPage";
import { CmsPage } from "../pages/CmsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "jobs", element: <JobsPage /> },
      { path: "jobs/:slug", element: <JobDetailPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        path: "profile",
        element: (
          <RoleGuard roles={["JOB_SEEKER"]}>
            <ProfilePage />
          </RoleGuard>
        )
      },
      {
        path: "resume",
        element: (
          <RoleGuard roles={["JOB_SEEKER"]}>
            <ResumePage />
          </RoleGuard>
        )
      },
      {
        path: "applications",
        element: (
          <RoleGuard roles={["JOB_SEEKER"]}>
            <ApplicationsPage />
          </RoleGuard>
        )
      },
      {
        path: "saved-jobs",
        element: (
          <RoleGuard roles={["JOB_SEEKER"]}>
            <SavedJobsPage />
          </RoleGuard>
        )
      },
      {
        path: "employer",
        element: (
          <RoleGuard roles={["EMPLOYER"]}>
            <EmployerDashboardPage />
          </RoleGuard>
        )
      },
      {
        path: "employer/company",
        element: (
          <RoleGuard roles={["EMPLOYER"]}>
            <CompanyProfilePage />
          </RoleGuard>
        )
      },
      {
        path: "employer/post-job",
        element: (
          <RoleGuard roles={["EMPLOYER"]}>
            <PostJobPage />
          </RoleGuard>
        )
      },
      {
        path: "employer/jobs",
        element: (
          <RoleGuard roles={["EMPLOYER"]}>
            <ManageJobsPage />
          </RoleGuard>
        )
      },
      {
        path: "employer/pipeline",
        element: (
          <RoleGuard roles={["EMPLOYER"]}>
            <PipelinePage />
          </RoleGuard>
        )
      },
      {
        path: "employer/billing",
        element: (
          <RoleGuard roles={["EMPLOYER"]}>
            <BillingPage />
          </RoleGuard>
        )
      },
      {
        path: "employer/team",
        element: (
          <RoleGuard roles={["EMPLOYER"]}>
            <TeamMembersPage />
          </RoleGuard>
        )
      },
      {
        path: "admin",
        element: (
          <RoleGuard roles={["ADMIN", "SUB_ADMIN"]}>
            <AdminDashboardPage />
          </RoleGuard>
        )
      },
      {
        path: "admin/users",
        element: (
          <RoleGuard roles={["ADMIN", "SUB_ADMIN"]}>
            <AdminUsersPage />
          </RoleGuard>
        )
      },
      {
        path: "admin/employers",
        element: (
          <RoleGuard roles={["ADMIN", "SUB_ADMIN"]}>
            <AdminEmployerVerificationPage />
          </RoleGuard>
        )
      },
      {
        path: "admin/jobs",
        element: (
          <RoleGuard roles={["ADMIN", "SUB_ADMIN"]}>
            <AdminJobsModerationPage />
          </RoleGuard>
        )
      },
      {
        path: "admin/categories",
        element: (
          <RoleGuard roles={["ADMIN", "SUB_ADMIN"]}>
            <AdminCategoriesPage />
          </RoleGuard>
        )
      },
      {
        path: "admin/reports",
        element: (
          <RoleGuard roles={["ADMIN", "SUB_ADMIN"]}>
            <AdminReportsPage />
          </RoleGuard>
        )
      },
      {
        path: "admin/settings",
        element: (
          <RoleGuard roles={["ADMIN"]}>
            <AdminSettingsPage />
          </RoleGuard>
        )
      },
      {
        path: "admin/audit",
        element: (
          <RoleGuard roles={["ADMIN", "SUB_ADMIN"]}>
            <AdminAuditLogsPage />
          </RoleGuard>
        )
      },
      { path: "about", element: <CmsPage title="About" /> },
      { path: "contact", element: <CmsPage title="Contact" /> },
      { path: "privacy", element: <CmsPage title="Privacy Policy" /> },
      { path: "terms", element: <CmsPage title="Terms" /> },
      { path: "c/:categorySlug", element: <JobsPage /> },
      { path: "c/:categorySlug/:subSlug", element: <JobsPage /> }
    ]
  }
]);
