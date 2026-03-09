import { useState } from 'react';
import RegisterForm from './components/RegisterForm.jsx';
import UserList from './components/UserList.jsx';

const styles = {
  container: {
    maxWidth: 640,
    margin: '40px auto',
    padding: '0 16px',
  },
  heading: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
    color: '#1a1a2e',
  },
  subheading: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
  },
  tab: (active) => ({
    padding: '8px 20px',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: active ? '#4f46e5' : '#e5e7eb',
    color: active ? '#fff' : '#374151',
    transition: 'background 0.15s',
  }),
};

export default function App() {
  const [tab, setTab] = useState('register');

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Registration App</h1>
      <p style={styles.subheading}>Node.js + Express + SQLite + React + Vite</p>

      <div style={styles.tabs}>
        <button style={styles.tab(tab === 'register')} onClick={() => setTab('register')}>
          Register
        </button>
        <button style={styles.tab(tab === 'users')} onClick={() => setTab('users')}>
          View Users
        </button>
      </div>

      {tab === 'register' ? <RegisterForm /> : <UserList />}
    </div>
  );
}
