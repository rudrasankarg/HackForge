import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import {
  Users, FolderOpen, ShieldCheck, Activity,
  AlertTriangle, ChevronRight, BrainCircuit,
  CheckCircle2, Sparkles, X, Bot, TrendingUp, ArrowUpRight
} from 'lucide-react';

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_JUDGES = [
  { name: 'Dr. Sarah Chen',  initials: 'SC', reviews: '12/12', avg: '8.4', cons: '94%', status: 'Healthy' },
  { name: 'Marcus Rowell',   initials: 'MR', reviews: '8/15',  avg: '6.1', cons: '71%', status: 'Warning' },
  { name: 'Elena Rostova',   initials: 'ER', reviews: '15/15', avg: '8.8', cons: '96%', status: 'Healthy' },
  { name: 'Dr. Alan Turing', initials: 'AT', reviews: '3/3',   avg: '9.2', cons: '98%', status: 'Healthy' },
];
const MOCK_ALERTS = [
  { type: 'warning', msg: 'Similar submissions detected — 2 teams have overlapping ideas', time: '10 mins ago' },
  { type: 'warning', msg: 'Judge scoring anomaly detected — Review recommended',           time: '1 hr ago'   },
  { type: 'success', msg: 'Batch evaluation completed successfully by Group A',            time: '2 hrs ago'  },
];
const FEED = [
  { time: '10:42 AM', title: 'Team Nova submitted project',  desc: 'QuantumLink repository successfully synced.' },
  { time: '10:35 AM', title: 'AI detected similarity',       desc: '82% overlap found between EcoChain & BioHack.' },
  { time: '10:20 AM', title: 'Judge completed evaluation',   desc: 'Sarah Chen finished reviewing Project Alpha.' },
  { time: '09:15 AM', title: 'New registration spike',       desc: '45 users registered in the last hour.' },
];
const AI_SYSTEMS = [
  { title: 'Similarity Detection', pct: 95,  barColor: '#ea580c', trackColor: '#fff7ed' },
  { title: 'Skill Matching',       pct: 100, barColor: '#0d9488', trackColor: '#f0fdfa' },
  { title: 'Judge Bias Monitor',   pct: 91,  barColor: '#0284c7', trackColor: '#e0f2fe' },
];
const SUGGESTIONS = ['Find suspicious submissions', 'Explain bias alerts', 'Generate report', 'Recommend judges'];

// ── Shared token ─────────────────────────────────────────────────────────
const T = {
  bg:       'var(--bg-base)',
  surface:  'var(--bg-surface)',
  border:   'var(--border)',
  text:     'var(--text-primary)',
  sub:      'var(--text-secondary)',
  muted:    'var(--text-muted)',
  orange:   'var(--brand)',
  orangeSoft:'var(--brand-dim)',
  success:  'var(--success)',
  successSoft:'var(--success-dim)',
  warn:     'var(--warning)',
  warnSoft: 'var(--warning-dim)',
};

// ── Sub-components ────────────────────────────────────────────────────────
function SectionHeader({ title, children }) {
  return (
    <div
      className="px-6 py-4 flex items-center justify-between"
      style={{ background: 'transparent', borderBottom: `1px solid ${T.border}` }}
    >
      <h2 className="font-bold text-stone-500 uppercase tracking-widest" style={{ fontSize: 10 }}>{title}</h2>
      {children}
    </div>
  );
}

function Card({ children, className = '', style = {}, onClick, href }) {
  const base = {
    background: T.surface,
    borderRadius: 16,
    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.06)',
    border: `1px solid ${T.border}`,
    overflow: 'hidden',
    ...style,
  };
  if (href) return <Link to={href} className={`block ${className}`} style={base}>{children}</Link>;
  if (onClick) return <div className={`cursor-pointer ${className}`} style={base} onClick={onClick}>{children}</div>;
  return <div className={className} style={base}>{children}</div>;
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend, progress, linkTo }) {
  const inner = (
    <div className="p-5" style={{ height: '100%' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl" style={{ background: iconBg }}>
          <Icon size={20} style={{ color: iconColor }} />
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full font-bold" style={{ background: '#f0fdf4', color: '#15803d', fontSize: 10 }}>
              <TrendingUp size={10} /> {trend}
            </span>
          )}
          {linkTo && <ArrowUpRight size={15} style={{ color: T.muted }} />}
        </div>
      </div>
      <p className="font-bold text-stone-400 uppercase tracking-widest mb-1" style={{ fontSize: 10 }}>{label}</p>
      <p className="font-extrabold tracking-tight text-stone-900 leading-none" style={{ fontSize: 30 }}>{value}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: '#f5f5f4' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: T.orange }}
          />
        </div>
      )}
    </div>
  );

  const cardStyle = {
    background: T.surface,
    borderRadius: 16,
    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.06)',
    border: `1px solid ${T.border}`,
    overflow: 'hidden',
  };

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="block transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
        style={{ ...cardStyle, textDecoration: 'none' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 30px -6px rgba(234,88,12,0.15), 0 0 0 2px rgba(234,88,12,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px -4px rgba(0,0,0,0.06)'; }}
      >
        {inner}
      </Link>
    );
  }
  return <div style={cardStyle}>{inner}</div>;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const rolePath = user?.role === 'admin' ? 'admin' : 'organizer';

  const [data, setData]              = useState(null);
  const [secAlerts, setSecAlerts]    = useState([]);
  const [reviewerPerf, setRevPerf]   = useState([]);



  useEffect(() => {
    api.get('/analytics').then(setData).catch(() => {});
    api.get('/admin/reviewer-performance').then(setRevPerf).catch(() => {});
    api.get('/chat/security/alerts')
      .then(res => setSecAlerts(Array.isArray(res) ? res.filter(a => !a.resolved) : []))
      .catch(() => {});
  }, []);

  const stats = {
    participants: data?.totalParticipants || 248,
    projects:     data?.totalProjects     || 54,
    judges:       reviewerPerf?.length    || 8,
    evalProgress: 87,
  };

  const alerts = secAlerts.length > 0
    ? secAlerts.map(a => ({ type: a.severity === 'high' ? 'warning' : 'success', msg: a.message, time: 'recent' }))
    : MOCK_ALERTS;

  const MOCK_NAMES = [
    'Dr. Sarah Chen', 'Marcus Rowell', 'Elena Rostova', 'Dr. Alan Turing',
    'Grace Hopper', 'Ada Lovelace', 'Linus Torvalds', 'Richard Feynman'
  ];

  const judges = reviewerPerf?.length > 0
    ? reviewerPerf.map((r, i) => {
        const name = r.name || MOCK_NAMES[i % MOCK_NAMES.length];
        return {
          name,
          initials: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          reviews:  `${r.completedCount || 0}/${r.assignedCount || 15}`,
          avg:      r.avgScore != null ? r.avgScore.toFixed(1) : (8.0 + (i % 3) * 0.4).toFixed(1),
          cons:     r.consistency != null ? `${r.consistency}%` : '90%',
          status:   r.flagged ? 'Warning' : 'Healthy',
        };
      })
    : MOCK_JUDGES;



  return (
    <div className="app-shell" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar />

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-40 px-8 py-4"
          style={{ background: 'var(--bg-surface)', borderBottom: `1px solid ${T.border}`, backdropFilter: 'blur(12px)' }}
        >
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h1 className="font-extrabold tracking-tight text-stone-900" style={{ fontSize: 19 }}>
                  HackForge AI Dashboard
                </h1>
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold uppercase"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: 9, letterSpacing: '0.08em' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p style={{ fontSize: 13, color: T.sub }}>
                <span className="font-semibold text-stone-800">HackForge 2026</span>
                <span style={{ margin: '0 8px', color: T.muted }}>|</span>
                <span
                  className="font-semibold"
                  style={{ color: '#b45309', background: T.warnSoft, padding: '2px 8px', borderRadius: 6, fontSize: 12 }}
                >
                  Deadline: 2 days remaining
                </span>
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/${rolePath}/hackathons`)}
              >
                Manage Hackathon
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/${rolePath}/results`)}
              >
                View Results <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-7 flex-1">

          {/* ── METRIC CARDS ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            <StatCard
              label="Total Participants" value={stats.participants}
              icon={Users} iconBg={T.orangeSoft} iconColor={T.orange}
              trend="+12%" linkTo={`/${rolePath}/participants`}
            />
            <StatCard
              label="Projects Submitted" value={stats.projects}
              icon={FolderOpen} iconBg="#f0f9ff" iconColor="#0284c7"
              linkTo={`/${rolePath}/projects`}
            />
            <StatCard
              label="Judges Active" value={stats.judges}
              icon={ShieldCheck} iconBg={T.warnSoft} iconColor={T.warn}
            />
            <StatCard
              label="Evaluation Progress" value={`${stats.evalProgress}%`}
              icon={Activity} iconBg={T.successSoft} iconColor={T.success}
              progress={stats.evalProgress}
            />
          </div>

          {/* ── MIDDLE ROW ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* AI Intelligence */}
            <Card>
              <SectionHeader title="AI System Intelligence">
                <BrainCircuit size={15} style={{ color: T.orange }} />
              </SectionHeader>
              <div className="p-6 space-y-6">
                {AI_SYSTEMS.map(sys => (
                  <div key={sys.title}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-stone-700" style={{ fontSize: 13 }}>{sys.title}</span>
                      <span className="font-extrabold" style={{ fontSize: 13, color: sys.barColor }}>{sys.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: sys.trackColor }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${sys.pct}%`, background: sys.barColor }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Alerts */}
            <Card>
              <SectionHeader title="Alerts & Actions">
                <span
                  className="font-extrabold px-2 py-0.5 rounded-full"
                  style={{ background: T.warnSoft, color: '#92400e', fontSize: 10 }}
                >
                  2 NEW
                </span>
              </SectionHeader>
              <div>
                {alerts.map((a, i) => {
                  const isWarn = a.type === 'warning';
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3.5 px-5 py-4 group transition-colors"
                      style={{ borderBottom: i < alerts.length - 1 ? `1px solid ${T.border}` : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: isWarn ? T.warnSoft : T.successSoft,
                          border: `1px solid ${isWarn ? '#fde68a' : '#99f6e4'}`,
                        }}
                      >
                        {isWarn
                          ? <AlertTriangle size={14} style={{ color: T.warn }} />
                          : <CheckCircle2 size={14} style={{ color: T.success }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-700 leading-snug mb-1" style={{ fontSize: 13 }}>{a.msg}</p>
                        <p className="font-semibold uppercase tracking-wider text-stone-400" style={{ fontSize: 10 }}>{a.time}</p>
                      </div>
                      {isWarn && (
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 rounded-lg font-bold"
                          style={{ fontSize: 11, background: T.warnSoft, color: '#92400e', border: '1px solid #fde68a', flexShrink: 0 }}
                        >
                          Review
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <SectionHeader title="Activity Timeline" />
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 320 }}>
                {FEED.map((item, i) => (
                  <div key={i} className="relative flex gap-4" style={{ paddingBottom: i < FEED.length - 1 ? 28 : 0 }}>
                    {/* Line */}
                    {i < FEED.length - 1 && (
                      <div
                        className="absolute"
                        style={{ left: 9, top: 22, bottom: 0, width: 1, background: T.border }}
                      />
                    )}
                    {/* Dot */}
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-full border-2 bg-white mt-0.5 z-10"
                      style={{ minWidth: 20, borderColor: T.orange }}
                    />
                    <div>
                      <p className="font-bold text-stone-400 uppercase tracking-wider mb-0.5" style={{ fontSize: 10 }}>{item.time}</p>
                      <p className="font-bold text-stone-900 mb-0.5" style={{ fontSize: 13 }}>{item.title}</p>
                      <p className="text-stone-500" style={{ fontSize: 12, lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>

          {/* ── REVIEWER PERFORMANCE TABLE ──────────────────────────────── */}
          <Card>
            <SectionHeader title="Reviewer Performance & Bias">
              <button
                className="flex items-center gap-1 font-bold transition-colors"
                style={{ color: T.orange, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = '#c2410c'}
                onMouseLeave={e => e.currentTarget.style.color = T.orange}
              >
                Full Report <ChevronRight size={13} />
              </button>
            </SectionHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: `1px solid ${T.border}` }}>
                    {['Reviewer Profile', 'Reviews Done', 'Avg Score', 'Consistency', 'Bias Status'].map(col => (
                      <th
                        key={col}
                        className="font-bold text-stone-400 uppercase"
                        style={{ padding: '11px 20px', fontSize: 10, letterSpacing: '0.08em' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {judges.map((j, i) => (
                    <tr
                      key={i}
                      className="transition-colors cursor-pointer"
                      style={{ borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '13px 20px' }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                            style={{ fontSize: 11, background: '#f5f5f4', color: '#57534e', border: `1px solid ${T.border}` }}
                          >
                            {j.initials}
                          </div>
                          <span className="font-semibold text-stone-900" style={{ fontSize: 13 }}>{j.name}</span>
                        </div>
                      </td>
                      <td className="font-medium text-stone-600" style={{ padding: '13px 20px', fontSize: 13 }}>{j.reviews}</td>
                      <td className="font-bold text-stone-900" style={{ padding: '13px 20px', fontSize: 13 }}>{j.avg}</td>
                      <td className="font-medium text-stone-600" style={{ padding: '13px 20px', fontSize: 13 }}>{j.cons}</td>
                      <td style={{ padding: '13px 20px' }}>
                        {j.status === 'Warning' ? (
                          <span
                            className="inline-flex items-center gap-1.5 font-medium rounded-full"
                            style={{ background: T.warnSoft, color: '#92400e', fontSize: 12, padding: '4px 12px' }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.warn, display: 'inline-block' }} />
                            Warning
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 font-medium rounded-full"
                            style={{ background: T.successSoft, color: T.success, fontSize: 12, padding: '4px 12px' }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.success, display: 'inline-block' }} />
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      </main>


    </div>
  );
}
