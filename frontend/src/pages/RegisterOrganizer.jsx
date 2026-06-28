import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { Eye, EyeOff, ArrowRight, ShieldCheck, Mail, CheckCircle2, Loader2, RefreshCw, Upload, FileText } from 'lucide-react';

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

function StepIndicator({ current }) {
  const steps = [
    { n: 1, label: 'Contact Details' },
    { n: 2, label: 'Verify Email' },
    { n: 3, label: 'Company Profile' },
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

export default function RegisterOrganizer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    website: '',
    companyDescription: '',
    employeeId: '',
    idCardImage: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCd, setResendCd] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    if (resendCd > 0) {
      const timer = setTimeout(() => setResendCd((v) => v - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCd]);

  const validate = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address.',
    name: (v) => v.trim().length >= 2 ? '' : 'Contact name is required.',
    companyName: (v) => v.trim() ? '' : 'Company name is required.',
    employeeId: (v) => v.trim() ? '' : 'Employee ID number is required.',
    password: (v) => v.length >= 8 ? '' : 'Password must be at least 8 characters.',
    confirmPassword: (v) => v === form.password ? '' : 'Passwords do not match.',
  };

  const set = (k) => (val) => {
    const value = typeof val === 'string' ? val : val.target?.value ?? val;
    setForm((p) => ({ ...p, [k]: value }));
    if (validate[k]) setErrors((e) => ({ ...e, [k]: validate[k](value) }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const nameErr = validate.name(form.name);
    const emailErr = validate.email(form.email);
    if (nameErr || emailErr) {
      setErrors((e) => ({ ...e, name: nameErr, email: emailErr }));
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/auth/send-otp', { email: form.email.trim(), name: form.name.trim() });
      setSuccess('Verification code sent to your email.');
      setResendCd(60);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCd > 0) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/auth/send-otp', { email: form.email.trim(), name: form.name.trim() });
      setSuccess('New verification code sent.');
      setResendCd(60);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = e.target.elements.otp.value.trim();
    if (code.length !== 6) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/auth/verify-otp', { email: form.email.trim(), code });
      setSuccess(res.message || 'Email verified!');
      setTimeout(() => { setSuccess(''); setStep(3); }, 800);
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError('Image size must be less than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((p) => ({ ...p, idCardImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const companyErr = validate.companyName(form.companyName);
    const empIdErr = validate.employeeId(form.employeeId);
    const pwErr = validate.password(form.password);
    const cpErr = validate.confirmPassword(form.confirmPassword);
    
    if (!form.idCardImage) {
      setError('Corporate ID card image upload is required.');
      return;
    }

    if (companyErr || empIdErr || pwErr || cpErr) {
      setErrors({ companyName: companyErr, employeeId: empIdErr, password: pwErr, confirmPassword: cpErr });
      return;
    }
    
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/auth/register-organizer', {
        name: form.name,
        email: form.email,
        password: form.password,
        companyName: form.companyName,
        website: form.website,
        companyDescription: form.companyDescription,
        employeeId: form.employeeId,
        idCardImage: form.idCardImage,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: '#1c1917', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff' }}>HF</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: T.text }}>HackForge</span>
          </Link>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
          <div style={{ width: '100%', maxWidth: 480, textAlign: 'center', padding: '40px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: '50%', background: T.orangeSoft, border: `1px solid ${T.orangeBorder}`, alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: T.orange }}>
              <ShieldCheck size={32} />
            </div>
            
            <h2 style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', marginBottom: 16 }}>
              APPLICATION PENDING
            </h2>
            
            <p style={{ color: T.sub, fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
              Your company organizer registration has been received! Our system is evaluating your credentials via automated AI models, and final validation will be completed by system administrators shortly.
            </p>
            
            <Link to="/" style={{ display: 'flex', height: 48, background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--brand-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--brand)'}
            >
              RETURN TO HOMEPAGE
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: '#1c1917', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff' }}>HF</div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: T.text }}>HackForge</span>
        </Link>
        <Link to="/organizer/login" style={{ fontSize: 14, fontWeight: 600, color: T.sub, textDecoration: 'none' }}
          onMouseEnter={e => e.target.style.color = T.text} onMouseLeave={e => e.target.style.color = T.sub}>
          Log In
        </Link>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: T.orangeSoft, border: `1px solid ${T.orangeBorder}`, borderRadius: 99, color: T.orange, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            <ShieldCheck size={13} strokeWidth={3} />
            Organizer Registration
          </div>

          <h1 style={{ fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', color: T.text, marginBottom: 6 }}>
            Register Organization
          </h1>
          <p style={{ fontSize: 15, color: T.sub, marginBottom: 28 }}>
            Partner with us to host, evaluate, and reward talent.
          </p>

          {/* Step Indicator */}
          <StepIndicator current={step} />

          {/* Feedback */}
          {error   && <div style={{ marginBottom: 20 }}><Alert type="error"   msg={error}   /></div>}
          {success && <div style={{ marginBottom: 20 }}><Alert type="success" msg={success} /></div>}

          {/* STEP 1: Email entry */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <Label>Contact Name</Label>
                <input
                  type="text" value={form.name} onChange={set('name')}
                  placeholder="Aarav Patel" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                {errors.name && <p style={{ color: T.danger, fontSize: 12, marginTop: 4 }}>{errors.name}</p>}
              </div>

              <div>
                <Label>Business Email</Label>
                <input
                  type="email" value={form.email} onChange={set('email')}
                  placeholder="contact@acme.org" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                {errors.email && <p style={{ color: T.danger, fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
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

          {/* STEP 2: OTP verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: T.orangeSoft, border: `1px solid ${T.orangeBorder}` }}>
                <Mail size={16} style={{ color: T.orange, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Code sent to</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{form.email}</p>
                </div>
              </div>

              <div>
                <Label>6-Digit Verification Code</Label>
                <input
                  name="otp" type="text"
                  placeholder="000000" required maxLength={6}
                  style={{ ...inputStyle, fontSize: 24, fontWeight: 800, letterSpacing: '0.4em', textAlign: 'center', height: 60 }}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', height: 48,
                  background: loading ? '#c2763d' : T.orange,
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 20px', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 2px 12px rgba(234,88,12,0.25)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#c2410c'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = T.orange; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {loading ? 'Verifying…' : 'Verify Code'}
                </span>
                {!loading && <ArrowRight size={18} />}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button" onClick={handleResend} disabled={resendCd > 0 || loading}
                  style={{ background: 'none', border: 'none', cursor: resendCd > 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: resendCd > 0 ? T.muted : T.orange, display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
                >
                  <RefreshCw size={13} />
                  {resendCd > 0 ? `Resend in ${resendCd}s` : 'Resend Code'}
                </button>
                <button
                  type="button" onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: T.sub, padding: 0 }}
                >
                  ← Change Email
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Company profile details */}
          {step === 3 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: T.successSoft, border: `1px solid ${T.successBorder}` }}>
                <CheckCircle2 size={16} style={{ color: T.success, flexShrink: 0 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: T.success }}>
                  {form.email} — Verified ✓
                </p>
              </div>

              <div>
                <Label>Company / Institution Name</Label>
                <input
                  type="text" value={form.companyName} onChange={set('companyName')}
                  placeholder="e.g. Acme Tech Labs" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                {errors.companyName && <p style={{ color: T.danger, fontSize: 12, marginTop: 4 }}>{errors.companyName}</p>}
              </div>

              <div>
                <Label>Official Website</Label>
                <input
                  type="url" value={form.website} onChange={set('website')}
                  placeholder="https://acme.org"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>

              <div>
                <Label>Description of Company</Label>
                <textarea
                  value={form.companyDescription} onChange={set('companyDescription')}
                  placeholder="Briefly tell us about your company and what hackathons you plan to organize..."
                  rows={3}
                  style={{ ...inputStyle, height: 'auto', padding: '12px 16px', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>

              <div>
                <Label>Employee ID Number</Label>
                <input
                  type="text" value={form.employeeId} onChange={set('employeeId')}
                  placeholder="e.g. EMP-99812" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                {errors.employeeId && <p style={{ color: T.danger, fontSize: 12, marginTop: 4 }}>{errors.employeeId}</p>}
              </div>

              <div>
                <Label>Corporate ID Card Image</Label>
                <input
                  type="file" accept="image/*" onChange={handleFileChange}
                  style={{ display: 'none' }} id="id-card-upload"
                />
                <label htmlFor="id-card-upload" style={{ display: 'flex', height: 48, background: T.bg, border: `1px dashed ${T.border}`, borderRadius: 10, cursor: 'pointer', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: T.sub }}>
                  <Upload size={16} />
                  {form.idCardImage ? 'Change ID Card Image' : 'Upload ID Card (Image)'}
                </label>
                {form.idCardImage && (
                  <div style={{ marginTop: 12, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'center' }}>
                    <img src={form.idCardImage} alt="ID preview" style={{ maxHeight: 120, borderRadius: 6, objectFit: 'contain' }} />
                  </div>
                )}
              </div>

              <div>
                <Label>Password</Label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password} onChange={set('password')}
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
                {errors.password && <p style={{ color: T.danger, fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
              </div>

              <div>
                <Label>Confirm Password</Label>
                <input
                  type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
                  placeholder="••••••••" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T.orange}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
                {errors.confirmPassword && <p style={{ color: T.danger, fontSize: 12, marginTop: 4 }}>{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', height: 48, background: loading ? '#c2763d' : T.orange,
                  color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 20px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 2px 12px rgba(234,88,12,0.25)',
                  marginTop: 12
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#c2410c'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = T.orange; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {loading && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {loading ? 'Submitting Application…' : 'Submit Application'}
                </span>
                {!loading && <ArrowRight size={18} />}
              </button>
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
