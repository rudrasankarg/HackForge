import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Premium Minimal Header */}
      <header style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: '#1c1917', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 13, color: '#fff' }}>HF</div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>HackForge</span>
        </Link>
        <Link to="/register" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color='var(--text-primary)'} onMouseLeave={e=>e.target.style.color='var(--text-secondary)'}>
          Create account
        </Link>
      </header>

      {/* Centered Editorial Form */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 8 }}>
              Log in
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Enter your credentials to access your participant dashboard.
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: 14, marginBottom: 24, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@university.edu"
                required
                autoComplete="email"
                style={{ width: '100%', height: 48, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 16px', fontSize: 15, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ width: '100%', height: 48, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 48px 0 16px', fontSize: 15, fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = 'var(--border-focus)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', height: 48, background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}
              onMouseEnter={e => { if(!loading) { e.currentTarget.style.background = 'var(--brand-light)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { if(!loading) { e.currentTarget.style.background = 'var(--brand)'; e.currentTarget.style.transform = 'none'; } }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Are you an organizer?{' '}
              <Link to="/organizer/login" style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Go to Organizer Portal
              </Link>
            </p>
          </div>

        </div>
      </main>

    </div>
  );
}
