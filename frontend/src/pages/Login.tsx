import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = axios.create({ baseURL: '' });

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegister ? { email, password, fullName } : { email, password };
      const res = await API.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({ email: res.data.email, fullName: res.data.fullName }));
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.logo}>🔗</div>
        <h1 style={s.title}>LinkSnip</h1>
        <p style={s.subtitle}>Shorten URLs. Track Clicks. Share Anywhere.</p>

        <div style={s.tabs}>
          <button style={!isRegister ? s.tabActive : s.tab} onClick={() => setIsRegister(false)}>Login</button>
          <button style={isRegister ? s.tabActive : s.tab} onClick={() => setIsRegister(true)}>Register</button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input style={s.input} placeholder="Full Name" value={fullName}
              onChange={e => setFullName(e.target.value)} required />
        )}
          <input style={s.input} type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required />
          <input style={s.input} type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s: { [k: string]: React.CSSProperties } = {
  container: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { background: 'white', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' },
  logo: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' },
  subtitle: { fontSize: 14, color: '#666', margin: '0 0 28px' },
  tabs: { display: 'flex', gap: 4, marginBottom: 24, background: '#f5f5f5', borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: '10px', background: 'transparent', border: 'none',
    borderRadius: 8, cursor: 'pointer', fontSize: 14, color: '#666' },
  tabActive: { flex: 1, padding: '10px', background: 'white', border: 'none',
    borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#667eea',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #eee',
    fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none' },
  error: { color: '#e53e3e', fontSize: 13, margin: '0 0 12px' },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
    cursor: 'pointer', marginTop: 4 },
};
