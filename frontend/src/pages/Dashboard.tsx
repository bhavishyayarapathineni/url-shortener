import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API = axios.create({ baseURL: '' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface UrlItem {
  id: number; shortCode: string; shortUrl: string; originalUrl: string;
  title: string; clickCount: number; createdAt: string; expiresAt: string; active: boolean;
}

interface Stats { totalUrls: number; totalClicks: number; activeUrls: number; }

export default function Dashboard() {
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUrls: 0, totalClicks: 0, activeUrls: 0 });
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchData = useCallback(async () => {
    const [urlsRes, statsRes] = await Promise.all([API.get('/api/urls'), API.get('/api/stats')]);
    setUrls(urlsRes.data);
    setStats(statsRes.data);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/api/urls', {
        originalUrl, customAlias: customAlias || undefined,
        title: title || undefined, expiryDays: expiryDays ? parseInt(expiryDays) : undefined
      });
      setOriginalUrl(''); setCustomAlias(''); setTitle(''); setExpiryDays('');
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to create URL'); }
    finally { setLoading(false); }
  };

  const handleCopy = (url: UrlItem) => {
    navigator.clipboard.writeText(url.shortUrl);
    setCopied(url.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this URL?')) return;
    await API.delete(`/api/urls/${id}`);
    fetchData();
  };

  const handleToggle = async (id: number) => {
    await API.put(`/api/urls/${id}/toggle`);
    fetchData();
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };

  const chartData = urls.slice(0, 8).map(u => ({ name: u.shortCode, clicks: u.clickCount }));

  return (
    <div style={s.container}>
      <div style={s.navbar}>
        <div style={s.navLeft}>
          <span style={s.logo}>🔗</span>
          <span style={s.brand}>LinkSnip</span>
        </div>
        <div style={s.navRight}>
          <span style={s.welcome}>Hi, {user.fullName}</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div style={s.content}>
        <div style={s.statsRow}>
          {[
            { label: 'Total URLs', value: stats.totalUrls, icon: '🔗', color: '#667eea' },
            { label: 'Total Clicks', value: stats.totalClicks, icon: '👆', color: '#48bb78' },
            { label: 'Active URLs', value: stats.activeUrls, icon: '✅', color: '#ed8936' },
          ].map((stat, i) => (
            <div key={i} style={s.statCard}>
              <div style={s.statIcon}>{stat.icon}</div>
              <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={s.mainGrid}>
          <div style={s.leftCol}>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Shorten a URL</h2>
              <form onSubmit={handleCreate}>
                <input style={s.input} placeholder="https://your-long-url.com"
            value={originalUrl} onChange={e => setOriginalUrl(e.target.value)} required />
                <input style={s.input} placeholder="Custom alias (optional)"
                  value={customAlias} onChange={e => setCustomAlias(e.target.value)} />
                <input style={s.input} placeholder="Title (optional)"
                  value={title} onChange={e => setTitle(e.target.value)} />
                <input style={s.input} type="number" placeholder="Expiry days (optional)"
                  value={expiryDays} onChange={e => setExpiryDays(e.target.value)} />
                <button style={s.createBtn} type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Short URL'}
                </button>
              </form>
            </div>
            {chartData.length > 0 && (
              <div style={s.card}>
                <h2 style={s.cardTitle}>Click Analytics</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#667eea" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div style={s.rightCol}>
            <div style={s.card}>
              <h2 style={s.cardTitle}>Your URLs ({urls.length})</h2>
              {urls.length === 0 ? (
                <div style={s.empty}>No URLs yet. Create your first one!</div>
              ) : (
                <div style={s.urlList}>
                  {urls.map(url => (
                    <div key={url.id} style={{ ...s.urlCard, opacity: url.active ? 1 : 0.6 }}>
                      <div style={s.urlTop}>
                        <div style={s.urlTitle}>{url.title || url.originalUrl}</div>
                        <div style={s.urlBadge}>{url.clickCount} clicks</div>
                      </div>
                      <div style={s.shortUrlRow}>
                        <span style={s.shortUrl}>{url.shortUrl}</span>
                        <div style={s.urlActions}>
                          <button style={s.actionBtn} onClick={() => handleCopy(url)}>
                            {copied === url.id ? 'Copied!' : 'Copy'}
                          </button>
                          <button style={s.actionBtn} onClick={() => handleToggle(url.id)}>
                            {url.active ? 'Disable' : 'Enable'}
                          </button>
                          <button style={s.actionBtnRed} onClick={() => handleDelete(url.id)}>Delete</button>
                        </div>
                      </div>
                      <div style={s.urlOriginal}>{url.originalUrl}</div>
                      {url.expiresAt && (
                        <div style={s.urlExpiry}>
                          Expires: {new Date(url.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s: { [k: string]: React.CSSProperties } = {
  container: { minHeight: '100vh', background: '#f0f2f5' },
  navbar: { background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '0 32px',
    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: { fontSize: 28 },
  brand: { fontSize: 22, fontWeight: 800, color: 'white' },
  navRight: { display: 'flex', alignItems: 'center', gap: 16 },
  welcome: { fontSize: 14, color: 'rgba(255,255,255,0.9)' },
  logoutBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  content: { maxWidth: 1200, margin: '0 auto', padding: '28px 16px' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  statCard: { background: 'white', borderRadius: 16, padding: 24, textAlign: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  statIcon: { fontSize: 32, marginBottom: 8 },
  statValue: { fontSize: 36, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 13, color: '#888', marginTop: 6 },
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 },
  leftCol: { display: 'flex', flexDirection: 'column', gap: 20 },
  rightCol: { display: 'flex', flexDirection: 'column', gap: 20 },
  card: { background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: 18, fontWeight: 700, margin: '0 0 20px', color: '#1a1a2e' },
  input: { width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #eee',
    fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' },
  createBtn: { width: '100%', padding: 13, background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#888', padding: '40px 0', fontSize: 15 },
  urlList: { display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 600, overflowY: 'auto' },
  urlCard: { background: '#f8f9ff', borderRadius: 12, padding: 16, border: '1px solid #e8eaff' },
  urlTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  urlTitle: { fontSize: 14, fontWeight: 600, color: '#1a1a2e', flex: 1,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  urlBadge: { background: '#667eea', color: 'white', padding: '2px 10px',
    borderRadius: 20, fontSize: 12, fontWeight: 600, flexShrink: 0, marginLeft: 8 },
  shortUrlRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  shortUrl: { fontSize: 14, color: '#667eea', fontWeight: 600 },
  urlActions: { display: 'flex', gap: 6 },
  actionBtn: { padding: '4px 8px', background: 'white', border: '1px solid #ddd',
    borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  actionBtnRed: { padding: '4px 8px', background: '#fff5f5', border: '1px solid #fed7d7',
    borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  urlOriginal: { fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  urlExpiry: { fontSize: 11, color: '#e53e3e', marginTop: 4 },
};
