import type { Route } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { isAdminAuthenticated } from "@/server/admin/auth";
import { getSiteContent } from "@/server/content/store";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login" as Route);
  }

  const content = await getSiteContent();

  return <AdminDashboard initialContent={content} />;
}
