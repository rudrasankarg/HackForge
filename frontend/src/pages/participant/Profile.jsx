import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { User, Mail, Save, Loader, AlertCircle, CheckCircle, Shield, Info } from 'lucide-react';

let T = {
  bg:      'var(--bg-base)',
  surface: 'var(--bg-surface)',
  border:  'var(--border)',
  text:    'var(--text-primary)',
  sub:     'var(--text-secondary)',
  muted:   'var(--text-muted)',
  orange:  'var(--brand)',
};

function SectionCard({ children, style = {} }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      boxShadow: '0 4px 20px -4px rgba(0,0,0,0.06)',
      borderRadius: 16,
      padding: '24px 26px',
      transition: 'background 0.2s, border-color 0.2s, color 0.2s',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ icon: Icon, color, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={15} color={color} strokeWidth={2} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 14, color: T.text, letterSpacing: '-0.01em' }}>
        {children}
      </span>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: 11, fontWeight: 700,
      color: T.sub, marginBottom: 8,
      textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>
      {children}
    </label>
  );
}

export default function ParticipantProfile() {
  const { user, login } = useAuth();
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState('');
  const [error,    setError]    = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', preferredLanguage: 'en' });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('hf_theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('hf_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  useEffect(() => {
    if (user) setFormData({ name: user.name || '', email: user.email || '', preferredLanguage: user.preferredLanguage || 'en' });
  }, [user]);

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Name cannot be empty.'); return; }
    setLoading(true); setMessage(''); setError('');
    try {
      const res = await api.patch('/users/me', { name: formData.name, preferredLanguage: formData.preferredLanguage });
      login(localStorage.getItem('hf_token'), res);
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'HF';

  const inputStyle = {
    width: '100%', background: T.bg,
    border: `1px solid ${T.border}`,
    borderRadius: 10, padding: '0 14px',
    height: 44, color: T.text, fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.15s',
  };

  const disabledInputStyle = {
    ...inputStyle,
    background: darkMode ? '#120f0e' : '#f5f5f4',
    color: T.muted,
    cursor: 'not-allowed',
    border: `1px solid ${T.border}`,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar />

      <main style={{ flex: 1, marginLeft: 252, padding: '40px 48px', overflowY: 'auto' }}>

        {/* Page header */}
        <header style={{ marginBottom: 36 }}>
          <h1 style={{
            fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em',
            color: T.text, marginBottom: 6,
          }}>
            Account Settings
          </h1>
          <p style={{ fontSize: 14, color: T.sub }}>
            Manage your profile details and account preferences.
          </p>
        </header>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, maxWidth: 900, alignItems: 'start' }}>

          {/* LEFT: Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Personal details */}
            <SectionCard>
              <SectionLabel icon={User} color={T.orange}>Personal Details</SectionLabel>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <FieldLabel>Full Name</FieldLabel>
                  <input
                    type="text" name="name"
                    value={formData.name} onChange={handleChange}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = T.orange}
                    onBlur={e => e.target.style.borderColor = T.border}
                    required
                  />
                </div>

                <div>
                  <FieldLabel>Preferred Email Language</FieldLabel>
                  <select
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = T.orange}
                    onBlur={e => e.target.style.borderColor = T.border}
                  >
                    <option value="en">English</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Email Address</FieldLabel>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email" name="email"
                      value={formData.email}
                      disabled style={disabledInputStyle}
                    />
                    <div style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 10, fontWeight: 700, color: T.muted,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      Locked
                    </div>
                  </div>
                  <p style={{ fontSize: 11.5, color: T.muted, marginTop: 6 }}>
                    Email cannot be changed. Contact an admin if needed.
                  </p>
                </div>

                {/* Feedback messages */}
                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
                    color: '#dc2626', fontSize: 13,
                  }}>
                    <AlertCircle size={15} strokeWidth={2} /> {error}
                  </div>
                )}
                {message && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 14px', borderRadius: 10,
                    background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.2)',
                    color: '#0d9488', fontSize: 13,
                  }}>
                    <CheckCircle size={15} strokeWidth={2} /> {message}
                  </div>
                )}

                <div>
                  <button
                    type="submit" disabled={loading}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '0 24px', height: 44,
                      background: loading ? 'rgba(234,88,12,0.5)' : T.orange,
                      color: '#fff', border: 'none', borderRadius: 10,
                      fontSize: 14, fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#c2410c'; }}
                    onMouseLeave={e => { if (!loading) e.currentTarget.style.background = T.orange; }}
                  >
                    {loading
                      ? <Loader size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                      : <Save size={16} strokeWidth={2} />
                    }
                    Save Changes
                  </button>
                </div>
              </form>
            </SectionCard>

            {/* Security card */}
            <SectionCard>
              <SectionLabel icon={Shield} color="#d97706">Security</SectionLabel>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>Password</div>
                  <div style={{ fontSize: 12.5, color: T.muted }}>
                    Last changed — never (using default credentials)
                  </div>
                </div>
                <button style={{
                  padding: '0 16px', height: 36,
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                  Change
                </button>
              </div>
            </SectionCard>

            {/* Theme Preferences Card */}
            <SectionCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>Dark Theme</div>
                  <div style={{ fontSize: 12.5, color: T.muted }}>
                    Switch between light and dark display preferences.
                  </div>
                </div>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  style={{
                    padding: '0 16px', height: 36,
                    background: darkMode ? '#292524' : '#f5f5f4',
                    border: `1px solid ${T.border}`,
                    color: T.text, borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  {darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </button>
              </div>
            </SectionCard>
          </div>

          {/* RIGHT: Avatar + Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Avatar card */}
            <SectionCard style={{ alignItems: 'center', textAlign: 'center', padding: '28px 24px' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: '#1c1917',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800,
                color: '#fff', margin: '0 auto 14px',
                boxShadow: '0 0 0 4px rgba(234,88,12,0.12), 0 4px 16px rgba(0,0,0,0.12)',
              }}>
                {initials}
              </div>

              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 12, color: T.muted, textTransform: 'capitalize', marginBottom: 16 }}>
                {user?.role}
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 99,
                background: T.bg, border: `1px solid ${T.border}`,
                color: T.sub, fontSize: 12,
              }}>
                <Mail size={11} strokeWidth={2} />
                {user?.email}
              </div>
            </SectionCard>

            {/* Info note */}
            <SectionCard>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0, marginTop: 2,
                  background: 'rgba(234,88,12,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Info size={14} color={T.orange} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Important Note
                  </div>
                  <p style={{ fontSize: 12.5, color: T.sub, lineHeight: 1.7 }}>
                    Ensure your name matches your official institutional ID — it will appear on certificates and credentials issued after the hackathon.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

        </div>
      </main>
    </div>
  );
}