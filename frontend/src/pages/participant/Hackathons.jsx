import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import {
  CalendarDays, Trophy, MessageSquare, ChevronLeft, Star,
  ExternalLink, AlertCircle, CheckCircle, MapPin, Clock,
  Users, Zap, Search, Filter
} from 'lucide-react';

/* ── palette ── */
const C = {
  bg:       'var(--bg-base)',
  surface:  'var(--bg-surface)',
  elevated: 'var(--bg-elevated)',
  border:   'var(--border)',
  text:     'var(--text-primary)',
  sub:      'var(--text-secondary)',
  muted:    'var(--text-muted)',
  brand:    'var(--brand)',
  brandDim: 'var(--brand-dim)',
};

const STATUS_CONFIG = {
  active:    { bg: 'rgba(16,185,129,0.08)',  color: '#059669', dot: '#10b981', label: 'Active'     },
  open:      { bg: 'rgba(16,185,129,0.08)',  color: '#059669', dot: '#10b981', label: 'Open'       },
  upcoming:  { bg: 'rgba(99,102,241,0.08)',  color: '#6366f1', dot: '#818cf8', label: 'Upcoming'   },
  completed: { bg: 'rgba(100,116,139,0.08)', color: '#64748b', dot: '#94a3b8', label: 'Completed'  },
  closed:    { bg: 'rgba(100,116,139,0.08)', color: '#64748b', dot: '#94a3b8', label: 'Closed'     },
};

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 99,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.04em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:'50%', background:'rgba(245,158,11,0.1)', color:'#d97706', fontWeight:800, fontSize:13, border:'1px solid rgba(245,158,11,0.25)' }}>1</span>
  );
  if (rank === 2) return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:'50%', background:'rgba(100,116,139,0.1)', color:'#64748b', fontWeight:800, fontSize:13, border:'1px solid rgba(100,116,139,0.2)' }}>2</span>
  );
  if (rank === 3) return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:'50%', background:'rgba(234,88,12,0.08)', color:'#c2410c', fontWeight:800, fontSize:13, border:'1px solid rgba(234,88,12,0.2)' }}>3</span>
  );
  return <span style={{ fontSize:13, color:C.muted, fontWeight:600, paddingLeft:4 }}>{rank || '—'}</span>;
}

const inputStyle = {
  background: '#f8fafc', border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '0 12px 0 36px',
  height: 38, color: C.text, fontSize: 13,
  outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: 'Outfit, sans-serif',
};

export default function ParticipantHackathons() {
  const [view,            setView]            = useState('list');
  const [selectedEvent,   setSelectedEvent]   = useState(null);
  const [hackathons,      setHackathons]      = useState([]);
  const [projects,        setProjects]        = useState([]);
  const [feedbackRating,  setFeedbackRating]  = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [search,          setSearch]          = useState('');
  const [filter,          setFilter]          = useState('all');
  const [myTeam,          setMyTeam]          = useState(null);
  const [loadingTeam,     setLoadingTeam]     = useState(false);

  useEffect(() => {
    api.get('/hackathons').then(res => { setHackathons(res); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view === 'detail' && selectedEvent) {
      setLoadingTeam(true);
      api.get(`/teams/mine?hackathonId=${selectedEvent._id}`)
        .then(res => setMyTeam(res))
        .catch(() => setMyTeam(null))
        .finally(() => setLoadingTeam(false));
      api.get('/projects').then(res => setProjects(res.filter(p => p.hackathonId === selectedEvent._id))).catch(() => setProjects([]));
    }
  }, [view, selectedEvent]);

  const handleOpenDetail = (event) => {
    setSelectedEvent(event); setView('detail');
    setError(''); setSuccess(''); setFeedbackRating(0);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    const content = e.target.elements.content.value;
    if (!selectedEvent || !content || feedbackRating === 0) { setError('Please provide both a rating and comments.'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      await api.post('/feedback', { hackathonId: selectedEvent._id, type: 'general', rating: feedbackRating, content });
      setSuccess('Thank you! Your feedback has been submitted.');
      setFeedbackRating(0); e.target.reset();
    } catch (err) { setError(err.message || 'Failed to submit feedback.'); }
    finally { setSubmitting(false); }
  };

  const formatDate = (start, end, h) => {
    if (!start && h && h.submissionDeadline) {
      const regStart = h.createdAt ? new Date(h.createdAt) : new Date();
      const subDead = new Date(h.submissionDeadline);
      const diffTime = Math.abs(subDead - regStart);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const subDeadStr = subDead.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return `${diffDays} days duration (ends ${subDeadStr})`;
    }
    if (!start) return 'Dates TBA';
    const opts = { month: 'short', day: 'numeric' };
    const s = new Date(start).toLocaleDateString(undefined, opts);
    const en = new Date(end).toLocaleDateString(undefined, { ...opts, year: 'numeric' });
    return `${s} – ${en}`;
  };

  const isConcluded = selectedEvent?.status === 'completed' || selectedEvent?.status === 'closed';

  const filtered = hackathons.filter(h => {
    const matchSearch = h.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || h.status === filter;
    return matchSearch && matchFilter;
  });

  /* ── DETAIL VIEW ── */
  if (view === 'detail' && selectedEvent) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: 240, overflowY: 'auto' }}>

          {/* Top bar */}
          <div style={{
            background: C.surface, borderBottom: `1px solid ${C.border}`,
            padding: '0 40px', height: 60,
            display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10,
          }}>
            <button
              onClick={() => setView('list')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: C.sub, background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 500, padding: '6px 10px',
                borderRadius: 7, transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.elevated}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <ChevronLeft size={15} strokeWidth={2.5} /> Back to Events
            </button>
            <span style={{ color: C.border, fontSize: 20 }}>|</span>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: C.text }}>
              {selectedEvent.name}
            </span>
            <StatusBadge status={selectedEvent.status} />
          </div>

          <div style={{ padding: '36px 40px', maxWidth: 960 }}>

            {/* Event info strip */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: '20px 24px', marginBottom: 24,
              display: 'flex', gap: 32, flexWrap: 'wrap',
            }}>
              {[
                { icon: Clock, label: 'Dates', value: formatDate(selectedEvent.startDate, selectedEvent.endDate, selectedEvent) },
                { icon: Users, label: 'Teams Registered', value: projects.length > 0 ? projects.length : '—' },
                { icon: MapPin, label: 'Mode', value: selectedEvent.mode || 'Online' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: C.brandDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} color={C.brand} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.muted, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* My Team for this Hackathon */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, overflow: 'hidden', marginBottom: 24,
            }}>
              <div style={{
                padding: '16px 24px', borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: C.elevated,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Users size={16} color="var(--brand)" strokeWidth={2} />
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: C.text }}>
                    My Team
                  </span>
                </div>
                {myTeam && (
                  <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>
                    Invite Code: <code style={{ fontFamily: 'JetBrains Mono, monospace', background: 'rgba(99,102,241,0.08)', padding: '2px 6px', borderRadius: 4 }}>{myTeam.inviteCode}</code>
                  </span>
                )}
              </div>
              <div style={{ padding: '20px 24px' }}>
                {loadingTeam ? (
                  <div style={{ color: C.muted, fontSize: 13 }}>Loading team details...</div>
                ) : myTeam ? (
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: C.text }}>{myTeam.name}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {myTeam.members?.map((m) => (
                        <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: C.elevated, borderRadius: 8, fontSize: 13, border: `1px solid ${C.border}` }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--accent))', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {m.name[0].toUpperCase()}
                          </div>
                          <span style={{ color: C.text, fontWeight: 500 }}>{m.name}</span>
                          {myTeam.leaderId?._id === m._id && <span className="badge badge-primary" style={{ fontSize: 9, padding: '1px 4px' }}>Lead</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <span style={{ fontSize: 13, color: C.muted }}>You are not registered in a team for this hackathon yet.</span>
                    <a href={`/participant/team?hackathonId=${selectedEvent._id}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      color: '#fff', background: 'var(--brand)', fontSize: 12, fontWeight: 600,
                      padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
                    }}>
                      Create or Join Team &rarr;
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, overflow: 'hidden', marginBottom: 24,
            }}>
              <div style={{
                padding: '16px 24px', borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 10, background: '#fffbeb',
              }}>
                <Trophy size={16} color="#d97706" strokeWidth={2} />
                <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 14, color: C.text }}>
                  Final Leaderboard
                </span>
              </div>

              {projects.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
                  No leaderboard data available yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.elevated, borderBottom: `1px solid ${C.border}` }}>
                      {['Rank', 'Project', 'Team', 'Score', 'Repo'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.muted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p, i) => (
                      <tr key={p._id || i} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = C.elevated}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px' }}><RankBadge rank={p.rank} /></td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: C.text }}>{p.title}</td>
                        <td style={{ padding: '12px 16px', color: C.sub }}>{p.teamName}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: 700, color: C.brand }}>{p.finalScore ? p.finalScore.toFixed(1) : '—'}</span>
                          {p.finalScore && <span style={{ color: C.muted, fontSize: 11 }}>/50</span>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {p.githubUrl ? (
                            <a href={p.githubUrl} target="_blank" rel="noreferrer" style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              color: C.brand, fontSize: 12, fontWeight: 600,
                              padding: '4px 10px', borderRadius: 6,
                              background: C.brandDim, border: `1px solid rgba(99,102,241,0.18)`,
                            }}>
                              View <ExternalLink size={11} strokeWidth={2.5} />
                            </a>
                          ) : <span style={{ color: C.muted }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Feedback form (concluded events only) */}
            {isConcluded && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 28px', maxWidth: 580 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <MessageSquare size={16} color={C.brand} strokeWidth={2} />
                  <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: 15, color: C.text }}>Post-Event Feedback</span>
                </div>
                <p style={{ fontSize: 13, color: C.sub, marginBottom: 24, lineHeight: 1.6 }}>
                  Share your experience to help us run better hackathons.
                </p>

                {error && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', color:'#dc2626', fontSize:13, marginBottom:16 }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                {success && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:8, background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.2)', color:'#059669', fontSize:13, marginBottom:16 }}>
                    <CheckCircle size={14} /> {success}
                  </div>
                )}

                <form onSubmit={handleSubmitFeedback} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Overall Rating</div>
                    <div style={{ display:'flex', gap:6 }}>
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star} type="button" onClick={() => setFeedbackRating(star)}
                          style={{
                            width:40, height:40, borderRadius:8, border:'none', cursor:'pointer',
                            background: feedbackRating >= star ? 'rgba(245,158,11,0.1)' : C.elevated,
                            color: feedbackRating >= star ? '#d97706' : C.muted,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            transition: 'all 0.15s',
                          }}
                        >
                          <Star size={20} strokeWidth={2} fill={feedbackRating >= star ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Comments</div>
                    <textarea
                      name="content" rows={4} required
                      placeholder="What went well? What could be improved?"
                      style={{
                        width:'100%', background:'#f8fafc', border:`1px solid ${C.border}`,
                        borderRadius:10, padding:'12px 14px', color:C.text, fontSize:13.5,
                        outline:'none', resize:'vertical', fontFamily:'Outfit, sans-serif', lineHeight:1.6,
                        boxSizing:'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
                      onBlur={e => e.target.style.borderColor = C.border}
                    />
                  </div>

                  <div>
                    <button type="submit" disabled={feedbackRating === 0 || submitting} style={{
                      padding:'0 24px', height:42, background: feedbackRating === 0 ? '#e2e8f0' : C.brand,
                      color: feedbackRating === 0 ? C.muted : '#fff',
                      border:'none', borderRadius:9, fontSize:13.5, fontWeight:600,
                      cursor: feedbackRating === 0 ? 'not-allowed' : 'pointer', transition:'background 0.15s',
                    }}>
                      {submitting ? 'Submitting…' : 'Submit Feedback'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  /* ── LIST VIEW ── */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 240, padding: '40px 44px', overflowY: 'auto' }}>

        {/* Header */}
        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: 26, fontWeight: 700, color: C.text, letterSpacing: '-0.03em', marginBottom: 6 }}>
            Hackathons
          </h1>
          <p style={{ fontSize: 14, color: C.sub }}>
            Browse events you're registered in, view leaderboards, and leave feedback.
          </p>
        </header>

        {/* Search + filter bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search size={14} color={C.muted} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text" placeholder="Search events…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.4)'}
              onBlur={e => e.target.style.borderColor = C.border}
            />
          </div>
          {['all', 'active', 'upcoming', 'completed'].map(f => (
            <button
              key={f} onClick={() => setFilter(f)}
              style={{
                padding: '0 14px', height: 38, borderRadius: 8,
                border: `1px solid ${filter === f ? 'rgba(99,102,241,0.3)' : C.border}`,
                background: filter === f ? C.brandDim : C.surface,
                color: filter === f ? C.brand : C.sub,
                fontSize: 13, fontWeight: filter === f ? 700 : 500,
                cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 180, borderRadius: 14, background: 'rgba(15,23,42,0.04)', border: `1px solid ${C.border}` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
            <CalendarDays size={36} strokeWidth={1.5} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 14, fontWeight: 500 }}>No events found.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {filtered.map(h => {
              const sc = STATUS_CONFIG[h.status] || STATUS_CONFIG.upcoming;
              return (
                <div
                  key={h._id}
                  onClick={() => handleOpenDetail(h)}
                  style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 14, padding: '22px 24px',
                    cursor: 'pointer', transition: 'all 0.18s',
                    boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.05)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: C.brandDim, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CalendarDays size={18} color={C.brand} strokeWidth={2} />
                    </div>
                    <StatusBadge status={h.status} />
                  </div>

                  {/* Name */}
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8, lineHeight: 1.35 }}>
                    {h.name}
                  </h3>

                  {/* Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                    <Clock size={12} color={C.muted} strokeWidth={2} />
                    <span style={{ fontSize: 12, color: C.muted }}>{formatDate(h.startDate, h.endDate, h)}</span>
                  </div>

                  {/* Footer */}
                  <div style={{
                    paddingTop: 14, borderTop: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {(h.status === 'active' || h.status === 'open') && (
                        <>
                          <Zap size={11} color="#10b981" strokeWidth={2.5} fill="#10b981" />
                          <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>Live now</span>
                        </>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: C.brand, fontWeight: 600 }}>
                      View details →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}