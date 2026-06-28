import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { Eye, EyeOff, ArrowRight, UserPlus, Mail, ShieldCheck, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import UniversityInput from '../components/UniversityInput';
import SkillsInput from '../components/SkillsInput';

const T = {
  bg:          'var(--bg-base)',
  surface:     'var(--bg-surface)',
  border:      'var(--border)',
  text:        'var(--text-primary)',
  sub:         'var(--text-secondary)',
  muted:       'var(--text-muted)',
  orange:      'var(--brand)',
  orangeSoft:  'var(--brand-dim)',
  orangeBorder:'var(--brand-border)',
  danger:      'var(--danger)',
  dangerSoft:  'var(--danger-dim)',
  dangerBorder:'rgba(220,38,38,0.2)',
  success:     'var(--success)',
  successSoft: 'var(--success-dim)',
  successBorder:'rgba(13,148,136,0.2)',
};

const inputStyle = {
  width: '100%', height: 48, background: 'var(--bg-surface)',
  border: `1px solid var(--border)`, borderRadius: 10,
  padding: '0 16px', fontSize: 15, fontFamily: 'Inter, sans-serif',
  color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};

function Label({ children }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
      {children}
    </label>
  );
}

function Alert({ type, msg }) {
  const isErr = type === 'error';
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
      background: isErr ? T.dangerSoft : T.successSoft,
      border: `1px solid ${isErr ? T.dangerBorder : T.successBorder}`,
      color: isErr ? T.danger : T.success,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {isErr ? '⚠' : '✓'} {msg}
    </div>
  );
}

// Step indicator
function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: 'Verify Email' },
    { n: 2, label: 'Enter OTP'   },
    { n: 3, label: 'Your Profile' },
    { n: 4, label: 'Create Account' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
              background: current > s.n ? T.success : current === s.n ? T.orange : T.border,
              color: current >= s.n ? '#fff' : T.muted,
              transition: 'all 0.3s',
            }}>
              {current > s.n ? <CheckCircle2 size={16} /> : s.n}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: current === s.n ? T.orange : T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: current > s.n + 1 ? T.success : current === s.n + 1 ? T.orange : T.border, margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();

  // Multi-step state
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: profile, 4: details

  // Form fields
  const [email,        setEmail]        = useState('');
  const [otp,          setOtp]          = useState('');
  const [name,         setName]         = useState('');
  const [password,     setPassword]     = useState('');
  const [role,         setRole]         = useState('participant');
  const [showPw,       setShowPw]       = useState(false);
  
  // Profile fields (Step 3)
  const [university,   setUniversity]   = useState('');
  const [experience,   setExperience]   = useState('beginner');
  const [skills,       setSkills]       = useState([]);
  const [bio,          setBio]          = useState('');
  const [githubUrl,    setGithubUrl]    = useState('');
  const [linkedinUrl,  setLinkedinUrl]  = useState('');
  const [gender,       setGender]       = useState('prefer-not-to-say');
  const [isUniversityValid, setIsUniversityValid] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [resendCd, setResendCd] = useState(0); // countdown in seconds

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/auth/send-otp', { email: email.trim(), name: name.trim() || 'User' });
      setSuccess(res.message || 'OTP sent! Check your inbox.');
      setStep(2);
      // Start 60s resend cooldown
      setResendCd(60);
      const timer = setInterval(() => {
        setResendCd(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCd > 0) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/auth/send-otp', { email: email.trim() });
      setSuccess('New OTP sent! Check your inbox.');
      setResendCd(60);
      const timer = setInterval(() => {
        setResendCd(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/auth/verify-otp', { email: email.trim(), code: otp.trim() });
      setSuccess(res.message || 'Email verified!');
      setTimeout(() => { setSuccess(''); setStep(3); }, 800);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: Register ──────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim())            return setError('Full name is required.');
    if (password.length < 8)     return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/auth/register', { 
        name: name.trim(), 
        email: email.trim(), 
        password, 
        role,
        university,
        institution: university,
        experience,
        skills,
        bio,
        githubUrl,
        linkedinUrl,
        demographics: { gender }
      });
      setSuccess('Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: '#1c1917', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff' }}>HF</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: T.text }}>HackForge</span>
        </Link>
        <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: T.sub, textDecoration: 'none' }}
          onMouseEnter={e => e.target.style.color = T.text} onMouseLeave={e => e.target.style.color = T.sub}>
          Log In
        </Link>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: T.orangeSoft, border: `1px solid ${T.orangeBorder}`, borderRadius: 99, color: T.orange, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            <UserPlus size={13} strokeWidth={3} />
            Get Started
          </div>

          <h1 style={{ fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', color: T.text, marginBottom: 6 }}>
            Create an account
          </h1>
          <p style={{ fontSize: 15, color: T.sub, marginBottom: 28 }}>
            Join the world's most intelligent hackathon platform.
          </p>

          {/* Step Indicator */}
          <StepIndicator current={step} />

          {/* ── Feedback ── */}
          {error   && <div style={{ marginBottom: 20 }}><Alert type="error"   msg={error}   /></div>}
          {success && <div style={{ marginBottom: 20 }}><Alert type="success" msg={success} /></div>}

          {/* ── STEP 1: Email entry ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <Label>Full Name</Label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>

              <div>
                <Label>Email Address</Label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                <p style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
                  We'll send a 6-digit verification code to this address.
                </p>
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', height: 48, background: loading ? '#c2763d' : T.orange,
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 20px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 2px 12px rgba(234,88,12,0.25)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#c2410c'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = T.orange; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {loading ? 'Sending OTP…' : 'Send Verification Code'}
                </span>
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP verification ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Email context */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: T.orangeSoft, border: `1px solid ${T.orangeBorder}` }}>
                <Mail size={16} style={{ color: T.orange, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Code sent to</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{email}</p>
                </div>
              </div>

              <div>
                <Label>6-Digit Verification Code</Label>
                <input
                  type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" required maxLength={6}
                  style={{ ...inputStyle, fontSize: 24, fontWeight: 800, letterSpacing: '0.4em', textAlign: 'center', height: 60 }}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>

              <button
                type="submit" disabled={loading || otp.length < 6}
                style={{
                  width: '100%', height: 48,
                  background: (loading || otp.length < 6) ? '#c2763d' : T.orange,
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 20px', cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 2px 12px rgba(234,88,12,0.25)',
                }}
                onMouseEnter={e => { if (!loading && otp.length >= 6) e.currentTarget.style.background = '#c2410c'; }}
                onMouseLeave={e => { if (!loading && otp.length >= 6) e.currentTarget.style.background = T.orange; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {loading ? 'Verifying…' : 'Verify Code'}
                </span>
                {!loading && <ArrowRight size={18} />}
              </button>

              {/* Resend + back */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button" onClick={handleResend} disabled={resendCd > 0 || loading}
                  style={{ background: 'none', border: 'none', cursor: resendCd > 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: resendCd > 0 ? T.muted : T.orange, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
                >
                  <RefreshCw size={13} />
                  {resendCd > 0 ? `Resend in ${resendCd}s` : 'Resend Code'}
                </button>
                <button
                  type="button" onClick={() => { setStep(1); setOtp(''); setError(''); setSuccess(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: T.sub, padding: 0 }}
                >
                  ← Change Email
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: Profile details ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: T.successSoft, border: `1px solid ${T.successBorder}` }}>
                <CheckCircle2 size={16} style={{ color: T.success, flexShrink: 0 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: T.success }}>
                  {email} — Verified ✓
                </p>
              </div>

              <div>
                <Label>University / Institution</Label>
                <UniversityInput value={university} onChange={setUniversity} onValidate={setIsUniversityValid} />
              </div>

              <div>
                <Label>Experience Level</Label>
                <select
                  value={experience} onChange={e => setExperience(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                >
                  <option value="beginner">Beginner — Less than 1 year</option>
                  <option value="intermediate">Intermediate — 1 to 3 years</option>
                  <option value="expert">Expert — 3+ years</option>
                </select>
              </div>

              <div>
                <Label>Skills</Label>
                <SkillsInput value={skills} onChange={setSkills} />
              </div>

              <div>
                <Label>Bio</Label>
                <textarea
                  value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Brief background — interests, past projects..."
                  rows={3}
                  style={{ ...inputStyle, height: 'auto', padding: '12px 16px', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <Label>GitHub</Label>
                  <input
                    type="text" value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
                    placeholder="github.com/user"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = T.orange}
                    onBlur={e => e.target.style.borderColor = T.border}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>LinkedIn</Label>
                  <input
                    type="text" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)}
                    placeholder="linkedin.com/in/user"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = T.orange}
                    onBlur={e => e.target.style.borderColor = T.border}
                  />
                </div>
              </div>

              <div>
                <Label>Gender</Label>
                <select
                  value={gender} onChange={e => setGender(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                >
                  <option value="prefer-not-to-say">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!isUniversityValid}
                style={{
                  width: '100%', height: 48, background: !isUniversityValid ? '#c2763d' : T.orange,
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 20px', cursor: !isUniversityValid ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 2px 12px rgba(234,88,12,0.25)',
                }}
                onMouseEnter={e => { if (isUniversityValid) e.currentTarget.style.background = '#c2410c'; }}
                onMouseLeave={e => { if (isUniversityValid) e.currentTarget.style.background = T.orange; }}
              >
                <span>Continue</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ── STEP 4: Account details ── */}
          {step === 4 && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: T.successSoft, border: `1px solid ${T.successBorder}` }}>
                <CheckCircle2 size={16} style={{ color: T.success, flexShrink: 0 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: T.success }}>
                  {email} — Verified ✓
                </p>
              </div>

              <div>
                <Label>Full Name</Label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>

              <div>
                <Label>Password</Label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters" required
                    style={{ ...inputStyle, paddingRight: 48 }}
                    onFocus={e => e.target.style.borderColor = T.orange}
                    onBlur={e => e.target.style.borderColor = T.border}
                  />
                  <button
                    type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Password strength */}
                {password.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < Math.min(4, Math.floor(password.length / 3)) ? (password.length >= 12 ? T.success : T.orange) : T.border, transition: 'background 0.3s' }} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Confirm Password</Label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  style={{
                    flex: 1, height: 48, background: 'none', border: `1px solid ${T.border}`, borderRadius: 10,
                    fontSize: 14, fontWeight: 700, color: T.sub, cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  Back
                </button>
                <button
                  type="submit" disabled={loading}
                  style={{
                    flex: 2, height: 48, background: loading ? '#c2763d' : T.orange,
                    color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 20px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 2px 12px rgba(234,88,12,0.25)',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#c2410c'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = T.orange; }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                    {loading ? 'Creating account…' : 'Create Account'}
                  </span>
                  {!loading && <ArrowRight size={18} />}
                </button>
              </div>

              <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, textAlign: 'center', padding: '0 8px' }}>
                By registering, you agree to our Code of Conduct and acknowledge that HackForge uses AI to detect bias and plagiarism.
              </p>
            </form>
          )}

        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
