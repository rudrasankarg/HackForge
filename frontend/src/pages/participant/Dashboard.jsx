import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Users, CalendarDays, ArrowUpRight,
  Megaphone, LifeBuoy, Scale, Copy, Check, Trophy, Clock, Zap, ChevronRight
} from 'lucide-react';

const C = {
  bg:      'var(--bg-base)',
  surface: 'var(--bg-surface)',
  border:  'var(--border)',
  text:    'var(--text-primary)',
  sub:     'var(--text-secondary)',
  muted:   'var(--text-muted)',
  brand:   'var(--brand)',
};

const ACCENT = {
  team:    { color: 'var(--brand)', bg: 'var(--brand-dim)', border: 'var(--brand-border)' },
  project: { color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'rgba(13,148,136,0.22)' },
  hack:    { color: 'var(--warning)', bg: 'var(--warning-dim)', border: 'rgba(217,119,6,0.22)' },
  ann:     { color: 'var(--info)', bg: 'var(--info-dim)', border: 'rgba(2,132,199,0.22)' },
  help:    { color: 'var(--danger)', bg: 'var(--danger-dim)', border: 'rgba(220,38,38,0.22)' },
  appeal:  { color: 'var(--text-primary)', bg: 'rgba(26,23,20,0.08)', border: 'rgba(26,23,20,0.22)' },
};

const STATUS_PILL = {
  submitted:  { bg: 'rgba(99,102,241,0.08)',   color: '#6366f1' },
  evaluated:  { bg: 'rgba(16,185,129,0.08)',   color: '#059669' },
  draft:      { bg: 'rgba(100,116,139,0.08)',  color: '#64748b' },
  pending:    { bg: 'rgba(245,158,11,0.08)',   color: '#d97706' },
};

function BentoCard({ children, onClick, accentKey, style = {} }) {
  const [hov, setHov] = useState(false);
  const a = ACCENT[accentKey] || ACCENT.team;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--bg-elevated)' : C.surface,
        border: `1px solid ${hov && onClick ? a.border : C.border}`,
        borderRadius: 14,
        padding: '22px 24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.18s ease',
        transform: hov && onClick ? 'translateY(-2px)' : 'none',
        boxShadow: hov && onClick ? '0 6px 20px rgba(15,23,42,0.09)' : '0 1px 3px rgba(15,23,42,0.05)',
        display: 'flex', flexDirection: 'column',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, label, accentKey, showArrow }) {
  const a = ACCENT[accentKey] || ACCENT.team;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={a.color} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted }}>
          {label}
        </span>
      </div>
      {showArrow && <ArrowUpRight size={15} color={C.muted} strokeWidth={2} />}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(15,23,42,0.07)', margin: '14px 0' }} />;
}

function StatusPill({ status }) {
  const s = STATUS_PILL[status?.toLowerCase()] || STATUS_PILL.draft;
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.04em' }}>
      {status || 'Draft'}
    </span>
  );
}

function Avatar({ name, index }) {
  const colors = ['#6366f1','#10b981','#f59e0b','#0ea5e9','#ec4899'];
  return (
    <div title={name} style={{ width: 28, height: 28, borderRadius: '50%', background: colors[index % colors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', border: '2px solid #fff', marginLeft: index > 0 ? -8 : 0, flexShrink: 0 }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ project: null, team: null, hackathons: [], announcements: [], tickets: [], appeals: [] });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/projects').catch(() => []),
      api.get('/teams/mine').catch(() => null),
      api.get('/hackathons').catch(() => []),
      api.get('/announcements').catch(() => []),
      api.get('/tickets').catch(() => []),
      api.get('/appeals/mine').catch(() => []),
    ]).then(([projects, team, hackathons, announcements, tickets, appeals]) => {
      const own = team?.projectId?._id
        ? projects.find(p => p._id === team.projectId._id)
        : projects.find(p => p.teamId === team?._id) || null;
      setData({ project: own || null, team, hackathons, announcements: announcements.slice(0, 4), tickets, appeals });
    }).finally(() => setLoading(false));
  }, []);

  const go = path => () => navigate(path);
  const copyCode = code => e => { e.stopPropagation(); navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const { project, team, hackathons, announcements, tickets, appeals } = data;
  const activeEvents   = hackathons.filter(h => h.status === 'active' || h.status === 'open').length;
  const openTickets    = tickets.filter(t => t.status !== 'resolved').length;
  const pendingAppeals = appeals.filter(a => a.status === 'pending' || a.status === 'under_review').length;

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: 240, padding: '40px 44px' }}>
          <div style={{ height: 28, width: 200, borderRadius: 8, background: 'rgba(15,23,42,0.06)', marginBottom: 10 }} />
          <div style={{ height: 16, width: 320, borderRadius: 6, background: 'rgba(15,23,42,0.04)', marginBottom: 32 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 200, borderRadius: 14, background: 'rgba(15,23,42,0.04)', border: `1px solid ${C.border}` }} />)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, padding: '40px 44px', overflowY: 'auto' }}>

        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: '-0.03em', marginBottom: 5 }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 14, color: C.sub }}>Here's an overview of your hackathon activity.</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 14 }}>

          {/* TEAM — 8 cols */}
          <div style={{ gridColumn: 'span 8' }}>
            <BentoCard accentKey="team" onClick={go('/participant/team')} style={{ height: '100%' }}>
              <CardHeader icon={Users} label="Team Workspace" accentKey="team" showArrow />
              {team ? (
                <>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 10 }}>{team.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
                    <div style={{ display: 'flex' }}>
                      {team.members?.map((m, i) => <Avatar key={m._id} name={m.name} index={i} />)}
                    </div>
                    <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>{team.members?.length} member{team.members?.length !== 1 ? 's' : ''}</span>
                  </div>
                  <Divider />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: C.muted }}>Invite code</span>
                      <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, color: ACCENT.team.color, background: ACCENT.team.bg, padding: '4px 10px', borderRadius: 6, border: `1px solid ${ACCENT.team.border}`, letterSpacing: '0.08em' }}>{team.inviteCode}</code>
                      <button onClick={copyCode(team.inviteCode)} style={{ width: 28, height: 28, borderRadius: 6, background: ACCENT.team.bg, border: `1px solid ${ACCENT.team.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied ? '#059669' : ACCENT.team.color, transition: 'all 0.15s' }}>
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <span style={{ fontSize: 12, color: ACCENT.team.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>Manage <ChevronRight size={13} /></span>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 6 }}>No Team Yet</p>
                  <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Form or join a team to start submitting projects.</p>
                  <Divider />
                  <span style={{ fontSize: 12, color: ACCENT.team.color, fontWeight: 600 }}>Create or join a team →</span>
                </>
              )}
            </BentoCard>
          </div>

          {/* PROJECT — 4 cols */}
          <div style={{ gridColumn: 'span 4' }}>
            <BentoCard accentKey="project" onClick={go('/participant/submit')} style={{ height: '100%' }}>
              <CardHeader icon={FolderOpen} label="Project Status" accentKey="project" showArrow />
              {project ? (
                <>
                  <StatusPill status={project.status} />
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700, color: C.text, margin: '10px 0 4px', lineHeight: 1.3 }}>{project.title}</p>
                  {project.status === 'evaluated' && project.finalScore != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                      <Trophy size={13} color="#d97706" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>{project.finalScore.toFixed(1)}/50{project.rank && <span style={{ color: C.muted, fontWeight: 400 }}> · #{project.rank}</span>}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 5 }}>No Submission</p>
                  <p style={{ fontSize: 13, color: C.muted }}>Your deliverable is pending.</p>
                </>
              )}
              <div style={{ flex: 1 }} />
              <Divider />
              <span style={{ fontSize: 12, color: ACCENT.project.color, fontWeight: 600 }}>{project ? 'Update submission' : 'Submit project'} →</span>
            </BentoCard>
          </div>

          {/* HACKATHONS — 3 cols */}
          <div style={{ gridColumn: 'span 3' }}>
            <BentoCard accentKey="hack" onClick={go('/participant/hackathons')} style={{ height: '100%' }}>
              <CardHeader icon={CalendarDays} label="Hackathons" accentKey="hack" showArrow />
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 34, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 3 }}>{hackathons.length}</p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>registered</p>
              {activeEvents > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }} />
                  <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>{activeEvents} active now</span>
                </div>
              )}
              <div style={{ flex: 1 }} />
              <Divider />
              <span style={{ fontSize: 12, color: ACCENT.hack.color, fontWeight: 600 }}>Browse events →</span>
            </BentoCard>
          </div>

          {/* ANNOUNCEMENTS — 3 cols */}
          <div style={{ gridColumn: 'span 3' }}>
            <BentoCard accentKey="ann" onClick={go('/participant/announcements')} style={{ height: '100%' }}>
              <CardHeader icon={Megaphone} label="Announcements" accentKey="ann" showArrow />
              {announcements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {announcements.map(a => (
                    <div key={a._id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', paddingBottom: 8, borderBottom: '1px solid rgba(15,23,42,0.05)' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: ACCENT.ann.color, marginTop: 6, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5 }}>{a.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <><p style={{ fontFamily: 'Sora, sans-serif', fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 5 }}>No Updates</p><p style={{ fontSize: 13, color: C.muted }}>Check back soon.</p></>
              )}
              <div style={{ flex: 1 }} />
              <Divider />
              <span style={{ fontSize: 12, color: ACCENT.ann.color, fontWeight: 600 }}>View all →</span>
            </BentoCard>
          </div>

          {/* HELP DESK — 3 cols */}
          <div style={{ gridColumn: 'span 3' }}>
            <BentoCard accentKey="help" onClick={go('/participant/help-desk')} style={{ height: '100%' }}>
              <CardHeader icon={LifeBuoy} label="Help Desk" accentKey="help" showArrow />
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 34, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 3 }}>{tickets.length}</p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>tickets raised</p>
              {openTickets > 0
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Zap size={12} color={ACCENT.help.color} /><span style={{ fontSize: 12, color: ACCENT.help.color, fontWeight: 600 }}>{openTickets} awaiting response</span></div>
                : <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Check size={12} color="#059669" /><span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>All resolved</span></div>
              }
              <div style={{ flex: 1 }} />
              <Divider />
              <span style={{ fontSize: 12, color: ACCENT.help.color, fontWeight: 600 }}>Ask mentors →</span>
            </BentoCard>
          </div>

          {/* APPEALS — 3 cols */}
          <div style={{ gridColumn: 'span 3' }}>
            <BentoCard accentKey="appeal" onClick={go('/participant/appeal')} style={{ height: '100%' }}>
              <CardHeader icon={Scale} label="Appeals & Grades" accentKey="appeal" showArrow />
              <p style={{ fontFamily: 'Sora, sans-serif', fontSize: 34, fontWeight: 800, color: C.text, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 3 }}>{appeals.length}</p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>appeals filed</p>
              {pendingAppeals > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} color={ACCENT.appeal.color} /><span style={{ fontSize: 12, color: ACCENT.appeal.color, fontWeight: 600 }}>{pendingAppeals} under review</span></div>}
              <div style={{ flex: 1 }} />
              <Divider />
              <span style={{ fontSize: 12, color: ACCENT.appeal.color, fontWeight: 600 }}>View results →</span>
            </BentoCard>
          </div>

        </div>
      </main>
    </div>
  );
}
