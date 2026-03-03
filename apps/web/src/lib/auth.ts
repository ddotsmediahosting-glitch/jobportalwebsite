export type AuthUser = {
  id: string;
  role: "JOB_SEEKER" | "EMPLOYER" | "ADMIN" | "SUB_ADMIN";
  email: string;
};

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem("authUser");
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function setAuthSession(params: { accessToken: string; refreshToken?: string; user: AuthUser }) {
  localStorage.setItem("accessToken", params.accessToken);
  if (params.refreshToken) localStorage.setItem("refreshToken", params.refreshToken);
  localStorage.setItem("authUser", JSON.stringify(params.user));
}

export function clearAuthSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("authUser");
}
