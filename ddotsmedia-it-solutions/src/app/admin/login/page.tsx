import type { Route } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { isAdminAuthenticated } from "@/server/admin/auth";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin" as Route);
  }

  return (
    <main id="main-content" className="container-shell flex min-h-screen items-center justify-center py-16">
      <div className="w-full max-w-xl">
        <AdminLoginForm />
      </div>
    </main>
  );
}
