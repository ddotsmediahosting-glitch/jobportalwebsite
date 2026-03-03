import { Navigate } from "react-router-dom";
import { getAuthUser } from "../lib/auth";

type Props = {
  roles: Array<"JOB_SEEKER" | "EMPLOYER" | "ADMIN" | "SUB_ADMIN">;
  children: JSX.Element;
};

export function RoleGuard({ roles, children }: Props) {
  const user = getAuthUser();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
