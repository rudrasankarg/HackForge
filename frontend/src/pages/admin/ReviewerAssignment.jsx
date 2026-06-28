import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import { Zap, Plus, Trash2, RefreshCw } from 'lucide-react';

export default function AdminAssignments() {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [manualForm, setManualForm] = useState({ reviewerId: '', projectId: '' });

  useEffect(() => {
    api.get('/hackathons').then((h) => { setHackathons(h); if (h.length) setSelectedHackathon(h[0]._id); }).catch(() => {});
    api.get('/users?role=reviewer&limit=100').then((r) => setReviewers(r.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedHackathon) return;
    setLoading(true);
    Promise.all([
      api.get(`/assignments?hackathonId=${selectedHackathon}`),
      api.get(`/projects?hackathonId=${selectedHackathon}`),
    ]).then(([a, p]) => { setAssignments(a); setProjects(p); }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedHackathon]);

  const runAI = async () => {
    setRunning(true);
    try {
      const res = await api.post('/assignments/ai-assign', { hackathonId: selectedHackathon, reviewersPerProject: 2 });
      setAssignments(res.assignments);
      toast.success(`AI assigned ${res.count} reviewer-project pairs in ${res.processingMs}ms`);
    } catch (err) {
      toast.error(err.message || 'Assignment failed');
    } finally {
      setRunning(false);
    }
  };

  const addManual = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/assignments/manual', { ...manualForm, hackathonId: selectedHackathon });
      setAssignments((prev) => [...prev, res]);
      setManualForm({ reviewerId: '', projectId: '' });
      toast.success('Assignment added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
      toast.info('Assignment removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const grouped = assignments.reduce((acc, a) => {
    const pid = a.projectId?._id || a.projectId;
    if (!acc[pid]) acc[pid] = { project: a.projectId, reviewers: [] };
    acc[pid].reviewers.push(a);
    return acc;
  }, {});

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Reviewer Assignments</h1>
            <p className="page-subtitle">AI-powered expertise matching — {assignments.length} assignments across {Object.keys(grouped).length} projects</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="form-select" style={{ width: 240 }} value={selectedHackathon} onChange={(e) => setSelectedHackathon(e.target.value)}>
              {hackathons.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
            <button className="btn btn-primary" onClick={runAI} disabled={running || !selectedHackathon} style={{ gap: 8 }}>
              {running ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Running...</> : <><Zap size={15} /> AI Auto-Assign</>}
            </button>
          </div>
        </div>

        {running && (
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <div className="spinner" style={{ width: 14, height: 14 }} />
            AI is matching reviewers to projects using expertise similarity, workload balance, and conflict detection...
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          <div>
            {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: 'auto' }} /></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.values(grouped).map(({ project, reviewers: rs }) => (
                  <div key={project?._id || project} className="card" style={{ padding: '18px 20px' }}>
                    <div className="flex-between" style={{ marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{project?.title || 'Untitled'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{project?.teamName} — {project?.domain}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(project?.techStack || []).slice(0, 3).map((t) => <span key={t} className="badge badge-muted" style={{ fontSize: 10 }}>{t}</span>)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {rs.map((a) => (
                        <div key={a._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>
                              {fmt.initials(a.reviewerId?.name)}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.reviewerId?.name || '—'}</div>
                                {(() => {
                                  const score = a.expertiseMatchScore;
                                  if (score === null || score === undefined) {
                                    return <span className="badge badge-muted" style={{ fontSize: 10, padding: '1px 6px' }}>Match: N/A</span>;
                                  }
                                  const badgeClass = score >= 80 ? 'badge-success' : score >= 60 ? 'badge-warning' : 'badge-muted';
                                  return (
                                    <span className={`badge ${badgeClass}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                                      Match: {score}%
                                    </span>
                                  );
                                })()}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.reviewerId?.email}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {a.assignedBy === 'ai' && (
                              <span className="badge badge-primary" style={{ fontSize: 10 }}>
                                AI {a.confidence ? `${(a.confidence * 100).toFixed(0)}%` : ''}
                              </span>
                            )}
                            {a.assignedBy === 'manual' && <span className="badge badge-muted" style={{ fontSize: 10 }}>Manual</span>}
                            <span className={`badge ${a.status === 'completed' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10, textTransform: 'capitalize' }}>{a.status}</span>
                            <button className="btn btn-icon btn-danger" onClick={() => remove(a._id)} style={{ padding: '4px 6px' }}><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!Object.keys(grouped).length && (
                  <div className="empty-state card">
                    <RefreshCw size={28} />
                    <h3>No assignments yet</h3>
                    <p>Run AI auto-assign or add manual assignments</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Manual Override</h3>
              <form onSubmit={addManual}>
                <div className="form-group">
                  <label className="form-label">Reviewer</label>
                  <select className="form-select" value={manualForm.reviewerId} onChange={(e) => setManualForm((p) => ({ ...p, reviewerId: e.target.value }))} required>
                    <option value="">Select reviewer...</option>
                    {reviewers.map((r) => <option key={r._id} value={r._id}>{r.name} — {(r.skills || []).slice(0, 2).join(', ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Project</label>
                  <select className="form-select" value={manualForm.projectId} onChange={(e) => setManualForm((p) => ({ ...p, projectId: e.target.value }))} required>
                    <option value="">Select project...</option>
                    {projects.map((p) => <option key={p._id} value={p._id}>{p.title} — {p.teamName}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-secondary btn-full">
                  <Plus size={14} /> Add Assignment
                </button>
              </form>
            </div>

            <div className="card">
              <h3 style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Assignment Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="flex-between">
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Assignments</span>
                  <span style={{ fontWeight: 700 }}>{assignments.length}</span>
                </div>
                <div className="flex-between">
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Completed</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>{assignments.filter((a) => a.status === 'completed').length}</span>
                </div>
                <div className="flex-between">
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>AI Assigned</span>
                  <span style={{ fontWeight: 700, color: 'var(--brand-light)' }}>{assignments.filter((a) => a.assignedBy === 'ai').length}</span>
                </div>
                <div className="flex-between">
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manual</span>
                  <span style={{ fontWeight: 700 }}>{assignments.filter((a) => a.assignedBy === 'manual').length}</span>
                </div>
                <hr className="divider" />
                <div className="flex-between">
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Avg Confidence</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {assignments.filter((a) => a.confidence).length
                      ? `${(assignments.filter((a) => a.confidence).reduce((s, a) => s + a.confidence, 0) / assignments.filter((a) => a.confidence).length * 100).toFixed(0)}%`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
