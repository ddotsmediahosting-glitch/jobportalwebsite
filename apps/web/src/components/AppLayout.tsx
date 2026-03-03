import { Link, NavLink, Outlet } from "react-router-dom";
import { clearAuthSession, getAuthUser } from "../lib/auth";

export function AppLayout() {
  const user = getAuthUser();

  return (
    <div className="min-h-screen">
      <header className="bg-brand-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold">UAE Jobs</Link>
          <nav className="flex items-center gap-4 text-sm">
            <NavLink to="/jobs">Jobs</NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/employer">Employer</NavLink>
            <NavLink to="/admin">Admin</NavLink>
            {user ? (
              <button
                className="rounded bg-white/20 px-2 py-1"
                onClick={() => {
                  clearAuthSession();
                  location.href = "/login";
                }}
              >
                Logout
              </button>
            ) : (
              <NavLink to="/login">Login</NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  );
}
