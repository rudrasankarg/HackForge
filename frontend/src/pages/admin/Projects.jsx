import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt, STATUS_MAP } from '../../utils/formatters';
import { FolderOpen, ExternalLink, Eye } from 'lucide-react';
import Github from '../../components/GithubIcon';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [hackathonFilter, setHackathonFilter] = useState('');

  useEffect(() => {
    api.get('/hackathons').then(setHackathons).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (hackathonFilter) params.set('hackathonId', hackathonFilter);
    api.get(`/projects?${params}`).then(setProjects).catch(() => {}).finally(() => setLoading(false));
  }, [hackathonFilter]);

  const handleDisqualify = async (id) => {
    try {
      await api.patch(`/projects/${id}/status`, { status: 'disqualified' });
      setProjects((prev) => prev.map((p) => p._id === id ? { ...p, status: 'disqualified' } : p));
      toast.info('Project disqualified');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter);

  const statusBadge = { submitted: 'badge-primary', evaluated: 'badge-success', disqualified: 'badge-danger', draft: 'badge-muted' };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Project Submissions</h1>
            <p className="page-subtitle">All submitted projects — admin view with full access</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="form-select" style={{ width: 200 }} value={hackathonFilter} onChange={(e) => setHackathonFilter(e.target.value)}>
              <option value="">All Hackathons</option>
              {hackathons.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['all', 'submitted', 'evaluated', 'disqualified', 'draft'].map((f) => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>{filtered.length} projects</span>
        </div>

        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setSelected(null)}>
            <div className="card" style={{ maxWidth: 640, width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex-between" style={{ marginBottom: 16 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>{selected.title}</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>Close</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Team</div><div style={{ fontWeight: 600 }}>{selected.teamName}</div></div>
                <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Domain</div><span className="badge badge-primary">{selected.domain}</span></div>
                <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Status</div><span className={`badge ${statusBadge[selected.status] || 'badge-muted'}`} style={{ textTransform: 'capitalize' }}>{selected.status}</span></div>
                <div><div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Score</div><div style={{ fontWeight: 700, fontSize: 20, color: 'var(--brand-light)' }}>{selected.finalScore ? fmt.score(selected.finalScore) : '—'}</div></div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{selected.description}</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Tech Stack</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(selected.techStack || []).map((t) => <span key={t} className="badge badge-muted">{t}</span>)}
                </div>
              </div>
              {selected.aiFeedback && (
                <div style={{ padding: '12px 14px', background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 11, color: 'var(--brand-light)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>AI Feedback</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.aiFeedback}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {selected.githubUrl && <a href={selected.githubUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><Github size={13} /> Repository</a>}
                {selected.demoUrl && <a href={selected.demoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><ExternalLink size={13} /> Demo</a>}
                {selected.status !== 'disqualified' && (
                  <button className="btn btn-danger btn-sm" onClick={() => { handleDisqualify(selected._id); setSelected(null); }}>Disqualify</button>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} type="list" height={80} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState 
            title="No Projects Submitted"
            subtitle="No projects submitted yet. Teams can submit their projects from the participant portal."
            icon="FolderOpen"
          />
        ) : filtered.length === 0 ? (
          <EmptyState 
            title="No Projects Found"
            subtitle="No projects match the selected status filter."
            icon="FolderOpen"
          />
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Team</th>
                    <th>Domain</th>
                    <th>Tech Stack</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{fmt.truncate(p.description, 60)}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{p.teamName}</td>
                      <td><span className="badge badge-primary" style={{ fontSize: 11 }}>{p.domain}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(p.techStack || []).slice(0, 3).map((t) => <span key={t} className="badge badge-muted" style={{ fontSize: 10 }}>{t}</span>)}
                          {(p.techStack || []).length > 3 && <span className="badge badge-muted" style={{ fontSize: 10 }}>+{p.techStack.length - 3}</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fmt.datetime(p.submittedAt || p.createdAt)}</td>
                      <td>
                        <span className={`badge ${statusBadge[p.status] || 'badge-muted'}`} style={{ textTransform: 'capitalize', fontSize: 11 }}>{p.status}</span>
                      </td>
                      <td>
                        {p.finalScore ? <span style={{ fontWeight: 700, color: 'var(--brand-light)' }}>{fmt.score(p.finalScore)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelected(p)}>
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
