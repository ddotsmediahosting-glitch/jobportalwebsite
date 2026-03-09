import { useState, useEffect } from 'react';

const s = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 32,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 16, fontWeight: 700 },
  refreshBtn: {
    padding: '6px 14px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    background: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: 700,
    color: '#374151',
  },
  td: {
    padding: '9px 10px',
    borderBottom: '1px solid #f0f0f0',
    color: '#374151',
    wordBreak: 'break-all',
  },
  empty: { textAlign: 'center', color: '#9ca3af', padding: 32 },
  error: { color: '#b91c1c', fontSize: 13, marginTop: 12 },
};

export default function UserList() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  async function fetchUsers() {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/users');
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to load users.');
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Cannot reach the server.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div style={s.card}>
      <div style={s.header}>
        <span style={s.title}>Registered Users ({users.length})</span>
        <button style={s.refreshBtn} onClick={fetchUsers}>Refresh</button>
      </div>

      {loading && <p style={s.empty}>Loading…</p>}
      {error   && <p style={s.error}>{error}</p>}

      {!loading && !error && users.length === 0 && (
        <p style={s.empty}>No users registered yet.</p>
      )}

      {!loading && users.length > 0 && (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>#</th>
              <th style={s.th}>Name</th>
              <th style={s.th}>Phone</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Registered</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={s.td}>{u.id}</td>
                <td style={s.td}>{u.name}</td>
                <td style={s.td}>{u.phone}</td>
                <td style={s.td}>{u.email}</td>
                <td style={s.td}>{new Date(u.created_at + 'Z').toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
