import { useState } from 'react';

const INITIAL = { name: '', phone: '', email: '', password: '' };

// ── Client-side validators (mirror server rules) ─────────────────────────────
function clientValidate({ name, phone, email, password }) {
  const errs = [];
  if (!name || name.trim().length < 2)
    errs.push('Name must be at least 2 characters.');
  if (!phone || !/^\+?[0-9\s\-().]{7,20}$/.test(phone.trim()))
    errs.push('Phone must be 7–20 digits.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errs.push('A valid email address is required.');
  if (!password || password.length < 8)
    errs.push('Password must be at least 8 characters.');
  return errs;
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 32,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
    color: '#374151',
  },
  input: (hasErr) => ({
    width: '100%',
    padding: '10px 12px',
    border: `1.5px solid ${hasErr ? '#ef4444' : '#d1d5db'}`,
    borderRadius: 6,
    fontSize: 14,
    outline: 'none',
    marginBottom: 16,
    color: '#111',
    background: '#fafafa',
  }),
  btn: (disabled) => ({
    width: '100%',
    padding: '11px 0',
    background: disabled ? '#a5b4fc' : '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    marginTop: 4,
  }),
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: 6,
    padding: '10px 14px',
    marginBottom: 16,
    fontSize: 13,
    color: '#b91c1c',
  },
  successBox: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: 6,
    padding: '12px 14px',
    marginBottom: 16,
    fontSize: 14,
    color: '#166534',
    fontWeight: 600,
  },
};

export default function RegisterForm() {
  const [form, setForm]       = useState(INITIAL);
  const [errors, setErrors]   = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors([]);
    setSuccess('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Client validation first
    const clientErrs = clientValidate(form);
    if (clientErrs.length > 0) {
      setErrors(clientErrs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors(data.errors || ['Registration failed. Please try again.']);
      } else {
        setSuccess(data.message || 'Registered successfully!');
        setForm(INITIAL);
      }
    } catch {
      setErrors(['Cannot reach the server. Is the backend running?']);
    } finally {
      setLoading(false);
    }
  }

  const fieldHasError = (field) =>
    errors.some((e) => e.toLowerCase().includes(field));

  return (
    <div style={s.card}>
      <form onSubmit={handleSubmit} noValidate>
        {success && <div style={s.successBox}>{success}</div>}

        {errors.length > 0 && (
          <div style={s.errorBox}>
            {errors.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        )}

        <label style={s.label}>Full Name</label>
        <input
          style={s.input(fieldHasError('name'))}
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Jane Doe"
          autoComplete="name"
        />

        <label style={s.label}>Phone Number</label>
        <input
          style={s.input(fieldHasError('phone'))}
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="+1 555-000-0000"
          autoComplete="tel"
        />

        <label style={s.label}>Email Address</label>
        <input
          style={s.input(fieldHasError('email'))}
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="jane@example.com"
          autoComplete="email"
        />

        <label style={s.label}>Password</label>
        <input
          style={s.input(fieldHasError('password'))}
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
        />

        <button style={s.btn(loading)} type="submit" disabled={loading}>
          {loading ? 'Registering…' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
