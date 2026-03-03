import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../features/auth/hooks";

export function LoginPage() {
  const [email, setEmail] = useState("admin@uaejobs.local");
  const [password, setPassword] = useState("Admin#12345");
  const navigate = useNavigate();
  const login = useLogin();

  return (
    <form
      className="mx-auto max-w-md space-y-3 rounded border bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        login.mutate(
          { email, password },
          {
            onSuccess: (data: { user: { role: string } }) => {
              if (data.user.role === "ADMIN" || data.user.role === "SUB_ADMIN") navigate("/admin");
              else if (data.user.role === "EMPLOYER") navigate("/employer");
              else navigate("/");
            }
          }
        );
      }}
    >
      <h1 className="text-xl font-semibold">Login</h1>
      <input className="w-full rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input className="w-full rounded border p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button className="w-full rounded bg-brand-700 py-2 text-white" type="submit">Sign in</button>
      {login.isError ? <p className="text-sm text-red-600">Login failed</p> : null}
    </form>
  );
}
