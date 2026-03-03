import { useState } from "react";
import { useRegister } from "../features/auth/hooks";

export function RegisterPage() {
  const [role, setRole] = useState<"JOB_SEEKER" | "EMPLOYER">("JOB_SEEKER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const register = useRegister();

  return (
    <form
      className="mx-auto max-w-md space-y-3 rounded border bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        register.mutate({ role, email, password });
      }}
    >
      <h1 className="text-xl font-semibold">Create account</h1>
      <select className="w-full rounded border p-2" value={role} onChange={(e) => setRole(e.target.value as any)}>
        <option value="JOB_SEEKER">Job Seeker</option>
        <option value="EMPLOYER">Employer</option>
      </select>
      <input className="w-full rounded border p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input className="w-full rounded border p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
      <button className="w-full rounded bg-brand-700 py-2 text-white" type="submit">Register</button>
      {register.isSuccess ? <p className="text-sm text-green-700">Account created. Check verification flow.</p> : null}
    </form>
  );
}
