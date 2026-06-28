import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Users, Key, Share2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '../../utils/toast';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

export default function ParticipantTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [hackathonId, setHackathonId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hackathons, setHackathons] = useState([]);
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryHackathonId = params.get('hackathonId');

    api.get('/hackathons')
      .then((list) => {
        setHackathons(list);
        if (list.length > 0) {
          const defaultId = queryHackathonId && list.some(h => h._id === queryHackathonId)
            ? queryHackathonId
            : list[0]._id;
          setHackathonId(defaultId);
          loadTeam(defaultId);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const loadTeam = async (hId) => {
    if (!hId) return;
    setLoading(true);
    try {
      const data = await api.get(`/teams/mine?hackathonId=${hId}`);
      setTeam(data);
    } catch { setTeam(null); } finally { setLoading(false); }
  };

  const handleHackathonChange = (selectedId) => {
    setHackathonId(selectedId);
    setError('');
    setSuccess('');
    loadTeam(selectedId);
  };

  const createTeam = async (e) => {
    e.preventDefault();
    if (!teamName || !hackathonId) { setError('Team name and hackathon are required.'); return; }
    setCreating(true); setError(''); setSuccess('');
    try {
      const t = await api.post('/teams', { name: teamName, hackathonId });
      setTeam(t);
      setSuccess('Team created successfully.');
    } catch (err) { setError(err.message); } finally { setCreating(false); }
  };

  const joinTeam = async (e) => {
    e.preventDefault();
    if (!inviteCode) { setError('Invite code is required.'); return; }
    if (!hackathonId) { setError('Please select a hackathon first.'); return; }
    setJoining(true); setError(''); setSuccess('');
    try {
      const t = await api.post('/teams/join', { inviteCode, hackathonId });
      setTeam(t);
      setSuccess('Joined team successfully.');
    } catch (err) { setError(err.message); } finally { setJoining(false); }
  };

  const leaveTeam = async () => {
    try {
      await api.delete(`/teams/mine/leave?hackathonId=${hackathonId}`);
      setTeam(null);
      setConfirmingLeave(false);
      toast.success('You have left the team');
    } catch (err) { setError(err.message); setConfirmingLeave(false); }
  };

  const isLead = team && team.leaderId?._id === user?._id;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 className="page-title">My Team</h1>
            <p className="page-subtitle">Create or join a team to submit a project</p>
          </div>
          {hackathons.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Select Hackathon:</span>
              <select
                className="form-select"
                value={hackathonId}
                onChange={(e) => handleHackathonChange(e.target.value)}
                style={{ width: 'auto', minWidth: 220, margin: 0, padding: '6px 12px', fontSize: 13 }}
              >
                {hackathons.map((h) => (
                  <option key={h._id} value={h._id}>{h.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><AlertCircle size={15} />{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}><CheckCircle size={15} />{success}</div>}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonCard type="list" height={150} />
            <SkeletonCard type="list" height={220} />
          </div>
        ) : team ? (
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="flex-between" style={{ marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>{team.name}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                    {team.members?.length} / {team.maxSize} members
                  </p>
                </div>
                {isLead && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--brand-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-border)' }}>
                    <Key size={14} style={{ color: 'var(--brand-light)' }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 700, letterSpacing: 3, color: 'var(--brand-light)' }}>{team.inviteCode}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(team.inviteCode); setSuccess('Invite code copied.'); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                    >
                      <Share2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {team.members?.map((m) => (
                  <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {m.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}
                        {team.leaderId?._id === m._id && (
                          <span className="badge badge-primary" style={{ marginLeft: 8, fontSize: 10 }}>Lead</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.institution}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {m.skills?.slice(0, 3).map((s) => <span key={s} className="badge badge-muted">{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>

              {team.projectId && (
                <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--success-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>Project submitted: {team.projectId.title}</span>
                </div>
              )}
            </div>

            {/* Suggested Teammates Section */}
            {team.members?.length < team.maxSize && (
              <SuggestedTeammates teamId={team._id} inviteCode={team.inviteCode} />
            )}

            <div style={{ marginTop: 24 }}>
              {confirmingLeave ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Are you sure you want to leave this team?</span>
                  <button className="btn btn-danger btn-sm" onClick={leaveTeam}>Confirm Leave</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmingLeave(false)}>Cancel</button>
                </div>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmingLeave(true)}>Leave Team</button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid-2">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div className="feature-icon"><Users size={20} /></div>
                <div>
                  <h3 style={{ fontWeight: 700 }}>Create a Team</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Start a new team and get an invite code</p>
                </div>
              </div>
              <form onSubmit={createTeam}>
                <div className="form-group">
                  <label className="form-label">Team Name</label>
                  <input className="form-input" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. InnovatorsX" />
                </div>
                <div className="form-group">
                  <label className="form-label">Hackathon</label>
                  <select className="form-select" value={hackathonId} onChange={(e) => setHackathonId(e.target.value)}>
                    <option value="">Select hackathon...</option>
                    {hackathons.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={creating}>
                  {creating ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Users size={15} />}
                  Create Team
                </button>
              </form>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div className="feature-icon" style={{ background: 'var(--accent-dim)', borderColor: 'rgba(6,182,212,0.2)', color: 'var(--accent)' }}><Key size={20} /></div>
                <div>
                  <h3 style={{ fontWeight: 700 }}>Join a Team</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Enter an invite code from your team lead</p>
                </div>
              </div>
              <form onSubmit={joinTeam}>
                <div className="form-group">
                  <label className="form-label">Invite Code</label>
                  <input className="form-input mono" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="e.g. A1B2C3D4" maxLength={8} style={{ letterSpacing: 4, fontSize: 18, textAlign: 'center' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hackathon</label>
                  <select className="form-select" value={hackathonId} onChange={(e) => setHackathonId(e.target.value)}>
                    <option value="">Select hackathon...</option>
                    {hackathons.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ background: 'var(--accent)', color: '#fff' }} disabled={joining}>
                  {joining ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Key size={15} />}
                  Join Team
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SuggestedTeammates({ teamId, inviteCode }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    api.get(`/teams/${teamId}/suggestions`)
      .then(setSuggestions)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [teamId]);

  const handleInvite = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success('Invite code copied to clipboard! Share it with the candidate.');
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div 
        className="flex-between" 
        style={{ cursor: 'pointer', borderBottom: isOpen ? '1px solid var(--border)' : 'none', paddingBottom: isOpen ? 12 : 0, marginBottom: isOpen ? 16 : 0 }} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={16} /> Suggested Teammates
        </h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isOpen ? 'Collapse ▲' : 'Expand ▼'}</span>
      </div>

      {isOpen && (
        <>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2].map((i) => (
                <SkeletonCard key={i} type="list" height={70} />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <EmptyState
              title="No Team Suggestions"
              subtitle="We couldn't find any available participants with complementary skills matching your team yet."
              icon="Users"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {suggestions.map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.name}
                      <span className="badge badge-accent" style={{ fontSize: 10, padding: '2px 6px' }}>Match: {s.complementarityScore}%</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {s.skills?.map((sk) => (
                        <span key={sk} className="badge badge-muted" style={{ fontSize: 9 }}>{sk}</span>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleInvite} style={{ padding: '6px 12px', fontSize: 12 }}>
                    Invite &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
