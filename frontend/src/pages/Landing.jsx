import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Lock, 
  Zap, 
  FileSearch, 
  ShieldCheck, 
  BarChart3, 
  CheckCircle2, 
  User, 
  UserPlus, 
  Building, 
  Briefcase, 
  ShieldAlert 
} from 'lucide-react';
import { api } from '../api';

const C = {
  bg: 'var(--bg-base)',
  surface: 'var(--bg-surface)',
  text: 'var(--text-primary)',
  sub: 'var(--text-secondary)',
  muted: 'var(--text-muted)',
  border: 'var(--border)',
  accent: 'var(--brand)',
  accentHover: 'var(--brand-light)',
};

const FEATURES = [
  {
    icon: Zap,
    title: 'Intelligent Registration',
    desc: 'Real-time duplicate detection via Levenshtein distance scoring and automated skill extraction using NLP.',
    color: '#e8610a',
  },
  {
    icon: FileSearch,
    title: 'Smart Reviewer Assignment',
    desc: 'Multi-objective optimization matching reviewer expertise to project domains using TF-IDF cosine similarity.',
    color: '#0d9488',
  },
  {
    icon: ShieldCheck,
    title: 'Real-Time Bias Detection',
    desc: 'Statistical anomaly detection identifying reviewer outliers via Z-score analysis and demographic patterns.',
    color: '#d97706',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Comprehensive event metrics — registration trends, evaluation completion rates, and predictive insights.',
    color: '#059669',
  },
];

export default function Landing() {
  const [stats, setStats] = useState({
    participants: '—', projects: '—', reviewers: '—', accuracy: '90%+'
  });
  
  const portalsRef = useRef(null);
  const dropdownRef = useRef(null);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);

  const scrollToPortals = (e) => {
    e?.preventDefault();
    portalsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    api.get('/analytics/public-summary')
      .then((data) => {
        setStats({
          participants: data.participants != null ? data.participants.toString() : '0',
          projects: data.projects != null ? data.projects.toString() : '0',
          reviewers: data.reviewers != null ? data.reviewers.toString() : '0',
          accuracy: '90%+'
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLoginDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Outfit, sans-serif', color: C.text }}>
      
      {/* ── PREMIUM NAV BAR ── */}
      <header style={{ 
        padding: '0 40px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 50, 
        background: 'var(--bg-header)', backdropFilter: 'blur(12px)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#1c1917', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 13, color: '#fff' }}>HF</div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: C.text }}>HackForge</span>
        </div>
        
        <nav style={{ display: 'none', md: 'flex', gap: 32, fontWeight: 500, fontSize: 14, color: C.sub }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color=C.text} onMouseLeave={e=>e.target.style.color=C.sub}>Product</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color=C.text} onMouseLeave={e=>e.target.style.color=C.sub}>Features</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e=>e.target.style.color=C.text} onMouseLeave={e=>e.target.style.color=C.sub}>AI Engine</span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={scrollToPortals} onMouseEnter={e=>e.target.style.color=C.text} onMouseLeave={e=>e.target.style.color=C.sub}>All Portals</span>
        </nav>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', position: 'relative' }}>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowLoginDropdown(!showLoginDropdown)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: C.sub, 
                fontSize: 14, 
                fontWeight: 600, 
                cursor: 'pointer', 
                transition: 'color 0.2s', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                padding: '10px 0'
              }}
              onMouseEnter={e=>e.target.style.color=C.text}
              onMouseLeave={e=>e.target.style.color=C.sub}
            >
              Log In
            </button>
            {showLoginDropdown && (
              <div style={{ 
                position: 'absolute', 
                top: 'calc(100% + 8px)', 
                right: 0, 
                background: C.surface, 
                border: `1px solid ${C.border}`, 
                borderRadius: 8, 
                boxShadow: '0 10px 25px rgba(26,23,20,0.1)', 
                padding: '8px 0', 
                minWidth: 160, 
                zIndex: 100 
              }}>
                <Link 
                  to="/login" 
                  onClick={() => setShowLoginDropdown(false)}
                  style={{ 
                    display: 'block', 
                    padding: '10px 16px', 
                    color: C.text, 
                    textDecoration: 'none', 
                    fontSize: 14, 
                    fontWeight: 500, 
                    transition: 'background 0.2s' 
                  }}
                  onMouseEnter={e=>e.target.style.background='var(--hover-bg)'}
                  onMouseLeave={e=>e.target.style.background='transparent'}
                >
                  Participant
                </Link>
                <Link 
                  to="/organizer/login" 
                  onClick={() => setShowLoginDropdown(false)}
                  style={{ 
                    display: 'block', 
                    padding: '10px 16px', 
                    color: C.text, 
                    textDecoration: 'none', 
                    fontSize: 14, 
                    fontWeight: 500, 
                    transition: 'background 0.2s' 
                  }}
                  onMouseEnter={e=>e.target.style.background='var(--hover-bg)'}
                  onMouseLeave={e=>e.target.style.background='transparent'}
                >
                  Organizer
                </Link>
                <Link 
                  to="/reviewer/login" 
                  onClick={() => setShowLoginDropdown(false)}
                  style={{ 
                    display: 'block', 
                    padding: '10px 16px', 
                    color: C.text, 
                    textDecoration: 'none', 
                    fontSize: 14, 
                    fontWeight: 500, 
                    transition: 'background 0.2s' 
                  }}
                  onMouseEnter={e=>e.target.style.background='var(--hover-bg)'}
                  onMouseLeave={e=>e.target.style.background='transparent'}
                >
                  Reviewer
                </Link>
              </div>
            )}
          </div>
          <Link to="/admin/login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, color: C.text, fontSize: 14, fontWeight: 600, padding: '10px 16px', borderRadius: 8, border: `1px solid ${C.border}`, transition: 'background 0.2s' }} onMouseEnter={e=>e.target.style.background='var(--hover-bg)'} onMouseLeave={e=>e.target.style.background='transparent'}>
            <Lock size={14} /> Admin
          </Link>
          <Link to="/register" style={{ textDecoration: 'none', background: C.accent, color: '#fff', fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 8, transition: 'background 0.2s' }} onMouseEnter={e=>e.target.style.background=C.accentHover} onMouseLeave={e=>e.target.style.background=C.accent}>
            Get Started
          </Link>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* ── ASYMMETRIC HERO ── */}
        <section style={{ padding: '80px 60px', display: 'flex', gap: '60px', alignItems: 'center', maxWidth: 1400, margin: '0 auto', flexWrap: 'wrap' }}>
          
          {/* Left: Copy */}
          <div style={{ flex: '1 1 500px', maxWidth: 640 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(232, 97, 10, 0.08)', borderRadius: 99, color: C.accent, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>
              <Zap size={13} fill="currentColor" /> AI-Powered Hackathon Platform
            </div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(48px, 5.5vw, 76px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', color: C.text, marginBottom: 24 }}>
              Where ideas compete.<br />Intelligence decides.
            </h1>
            <p style={{ fontSize: 'clamp(16px, 1.5vw, 19px)', color: C.sub, lineHeight: 1.6, marginBottom: 40, maxWidth: 540 }}>
              From registration to results — HackForge automates every step with AI fairness, smart reviewer matching, and real-time bias detection. Built for organizers who demand excellence.
            </p>
            
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
              <a href="#portals" onClick={scrollToPortals} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', background: C.accent, color: '#fff', fontSize: 16, fontWeight: 600, padding: '16px 32px', borderRadius: 10, transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(232, 97, 10, 0.25)' }} onMouseEnter={e=>{e.target.style.background=C.accentHover;e.target.style.transform='translateY(-1px)'}} onMouseLeave={e=>{e.target.style.background=C.accent;e.target.style.transform='none'}}>
                Access 6 Portals <ArrowRight size={18} />
              </a>
              <Link to="/register-organizer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', background: 'transparent', color: C.text, fontSize: 16, fontWeight: 600, padding: '15px 32px', borderRadius: 10, border: `1px solid ${C.border}`, transition: 'all 0.2s' }} onMouseEnter={e=>e.target.style.background='var(--hover-bg)'} onMouseLeave={e=>e.target.style.background='transparent'}>
                Register Organization
              </Link>
            </div>
            
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>
              — Trusted by top university clubs and tech organizations.
            </p>
          </div>

          {/* Right: Mock UI / Product Vis */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
            {/* Background decoration */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 300, height: 300, background: 'radial-gradient(circle, rgba(232,97,10,0.1) 0%, transparent 70%)', zIndex: 0 }} />
            
            {/* Mock Card 1: AI Evaluation */}
            <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '28px 32px', boxShadow: '0 20px 40px rgba(26,23,20,0.06)', position: 'relative', zIndex: 1, marginLeft: 'auto', width: '100%', maxWidth: 460 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>AI Judging Assistant</div>
                  <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700 }}>Project: QuantumLink</div>
                </div>
                <div style={{ background: 'rgba(232,97,10,0.08)', color: C.accent, padding: '8px 12px', borderRadius: 8, fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 20 }}>
                  8.7 <span style={{ fontSize: 12, opacity: 0.6 }}>/ 10</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Technical Depth', val: '88%', c: '#0f172a' },
                  { label: 'Creativity', val: '92%', c: C.accent },
                  { label: 'Impact', val: '80%', c: '#0d9488' }
                ].map(b => (
                  <div key={b.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
                      <span>{b.label}</span><span>{b.val}</span>
                    </div>
                    <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: b.val, background: b.c, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16, borderTop: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: '#059669' }}>
                <CheckCircle2 size={15} /> Fairness Check: No implicit bias detected.
              </div>
            </div>

            {/* Mock Card 2: Leaderboard */}
            <div style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '24px', boxShadow: '0 10px 30px rgba(26,23,20,0.04)', position: 'relative', zIndex: 1, width: '90%', maxWidth: 400, alignSelf: 'flex-start', transform: 'translateY(-10px)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Live Leaderboard Pulse</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { r: 1, n: 'NeuralShift', s: 9.2 },
                  { r: 2, n: 'QuantumLink', s: 8.7 },
                  { r: 3, n: 'EcoChain', s: 8.4 }
                ].map(l => (
                  <div key={l.r} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: l.r === 1 ? 'rgba(232,97,10,0.05)' : C.bg, borderRadius: 8, border: l.r === 1 ? `1px solid rgba(232,97,10,0.2)` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: l.r === 1 ? C.accent : C.muted }}>#{l.r}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{l.n}</span>
                    </div>
                    <span style={{ fontFamily: 'Sora, sans-serif', fontSize: 14, fontWeight: 700 }}>{l.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── PLATFORM PORTALS ── */}
        <section id="portals" ref={portalsRef} style={{ padding: '80px 40px', background: 'rgba(232, 97, 10, 0.03)', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(232, 97, 10, 0.1)', borderRadius: 99, color: C.accent, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Quick Access
              </div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', color: C.text }}>
                Choose Your Gateway
              </h2>
              <p style={{ fontSize: 16, color: C.sub, maxWidth: 600, margin: '8px auto 0' }}>
                Select the appropriate dashboard below to access your space on HackForge.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {[
                {
                  title: 'Participant Login',
                  desc: 'Sign in to manage your team, join chats, and submit projects.',
                  link: '/login',
                  icon: User,
                  color: C.accent,
                  btnText: 'Participant Login'
                },
                {
                  title: 'Participant Register',
                  desc: 'Register to participate and compete in active events.',
                  link: '/register',
                  icon: UserPlus,
                  color: '#0d9488',
                  btnText: 'Participant Register'
                },
                {
                  title: 'Organizer Login',
                  desc: 'Restricted console for company organizers to manage hackathons.',
                  link: '/organizer/login',
                  icon: Briefcase,
                  color: '#d97706',
                  btnText: 'Organizer Login'
                },
                {
                  title: 'Reviewer Login',
                  desc: 'Restricted console for expert reviewers and project evaluators.',
                  link: '/reviewer/login',
                  icon: FileSearch,
                  color: '#8b5cf6',
                  btnText: 'Reviewer Login'
                },
                {
                  title: 'Organization Register',
                  desc: 'Register a new organization to start hosting events.',
                  link: '/register-organizer',
                  icon: Building,
                  color: '#059669',
                  btnText: 'Organization Register'
                },
                {
                  title: 'Admin Login',
                  desc: 'Global control room for super admins and auditors.',
                  link: '/admin/login',
                  icon: ShieldAlert,
                  color: '#dc2626',
                  btnText: 'Admin Login'
                }
              ].map((p, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    background: C.surface, 
                    border: `1px solid ${C.border}`, 
                    borderRadius: 16, 
                    padding: '24px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(26,23,20,0.02)',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(26,23,20,0.08)';
                    e.currentTarget.style.borderColor = p.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,23,20,0.02)';
                    e.currentTarget.style.borderColor = C.border;
                  }}
                >
                  <div>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${p.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, color: p.color }}>
                      <p.icon size={22} />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>{p.title}</h3>
                    <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.5, marginBottom: 20, minHeight: 48 }}>{p.desc}</p>
                  </div>
                  <Link 
                    to={p.link} 
                    style={{ 
                      textDecoration: 'none', 
                      background: p.color, 
                      color: '#fff', 
                      fontSize: 13, 
                      fontWeight: 600, 
                      padding: '10px 14px', 
                      borderRadius: 8, 
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.opacity = '0.9'}
                    onMouseLeave={e => e.target.style.opacity = '1'}
                  >
                    {p.btnText} <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '40px 0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 32, padding: '0 24px' }}>
            {[
              { label: 'Registered Participants', val: stats.participants },
              { label: 'Projects Submitted', val: stats.projects },
              { label: 'Expert Reviewers', val: stats.reviewers },
              { label: 'Bias Detection Accuracy', val: stats.accuracy }
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '0 20px' }}>
                <div style={{ fontFamily: 'Sora, sans-serif', fontSize: 36, fontWeight: 800, color: C.text, marginBottom: 4 }}>{s.val}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROBLEM / SOLUTION ── */}
        <section style={{ padding: '120px 40px', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.1, color: C.text, marginBottom: 24, letterSpacing: '-0.02em' }}>
              Why most hackathons<br />break at scale.
            </h2>
            <p style={{ fontSize: 17, color: C.sub, lineHeight: 1.6, marginBottom: 32 }}>
              Organizing a hackathon with 500+ participants exposes the flaws in manual coordination. Spreadsheets fail. Judging becomes biased. Participants feel cheated.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { title: 'Inconsistent Scoring', desc: 'Manual judging relies on subjective opinions, leading to massive variance and unfair final results.' },
              { title: 'Reviewer Burnout', desc: 'Randomly assigning projects means reviewers read code outside their domain expertise.' },
              { title: 'Zero Transparency', desc: 'Participants wait days for results and receive no actionable feedback on their hard work.' }
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: C.surface, padding: '24px', borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: '0 4px 12px rgba(26,23,20,0.02)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.accent, marginTop: 8, flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{p.title}</h4>
                  <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section style={{ padding: '80px 40px', background: C.surface, borderTop: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>The architecture of fairness.</h2>
              <p style={{ fontSize: 17, color: C.sub, maxWidth: 600, margin: '0 auto' }}>Four core pillars designed to eliminate manual overhead and ensure every participant is judged entirely on merit.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ padding: '32px', borderRadius: 16, border: `1px solid ${C.border}`, background: C.bg, transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 12px 30px rgba(26,23,20,0.06)'}} onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                    <f.icon size={24} color={f.color} strokeWidth={2} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: C.text }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI CAPABILITIES (DARK SECTION) ── */}
        <section style={{ background: '#110f0d', color: '#fff', padding: '120px 40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24, marginBottom: 64 }}>
              <div>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>The intelligence layer.</h2>
                <p style={{ fontSize: 17, color: '#a39b93', maxWidth: 500 }}>HackForge doesn't just manage data; it actively understands it. Our models run locally and securely to assist, never to replace.</p>
              </div>
              <Link to="/register" style={{ color: C.accent, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                Read the AI Documentation <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {[
                { t: 'Explainable AI Judging', d: 'Every automated score comes with a natural language breakdown explaining exactly why criteria were met.' },
                { t: 'Algorithmic Bias Sweeps', d: 'Background processes constantly monitor reviewer deviations, flagging harsh or lenient grading instantly.' },
                { t: 'NLP Team Formation', d: 'Participants drop their ideas in plain text, and our system matches them with complementary skillsets.' }
              ].map((c, i) => (
                <div key={i} style={{ padding: '32px', background: '#1a1714', borderRadius: 16, border: '1px solid #2b2622' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Capability 0{i+1}</div>
                  <h4 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, fontFamily: 'Sora, sans-serif' }}>{c.t}</h4>
                  <p style={{ fontSize: 15, color: '#8a8178', lineHeight: 1.6 }}>{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FOOTER ── */}
        <section style={{ padding: '100px 40px', textAlign: 'center', background: C.surface, borderTop: `1px solid ${C.border}` }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 24, color: C.text }}>
            Ready to run your best<br />hackathon yet?
          </h2>
          <p style={{ fontSize: 17, color: C.sub, marginBottom: 40 }}>
            Join the platform built for organizers who care about the hacker experience.
          </p>
          <Link to="/register" style={{ display: 'inline-block', textDecoration: 'none', background: C.accent, color: '#fff', fontSize: 16, fontWeight: 600, padding: '16px 36px', borderRadius: 10, transition: 'background 0.2s', boxShadow: '0 4px 14px rgba(232, 97, 10, 0.25)' }} onMouseEnter={e=>e.target.style.background=C.accentHover} onMouseLeave={e=>e.target.style.background=C.accent}>
            Create your account
          </Link>
          <div style={{ marginTop: 24, fontSize: 14, color: C.muted }}>
            Already registered? <Link to="/login" style={{ color: C.text, fontWeight: 600, textDecoration: 'none' }}>Log in here</Link>.
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}`, background: C.bg, fontSize: 13, color: C.muted }}>
        <div>&copy; {new Date().getFullYear()} HackForge. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link to="/privacy-policy" style={{ color: C.muted, textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms-of-service" style={{ color: C.muted, textDecoration: 'none' }}>Terms of Service</Link>
          <Link to="/status" style={{ color: C.muted, textDecoration: 'none' }}>Status</Link>
        </div>
      </footer>
    </div>
  );
}
