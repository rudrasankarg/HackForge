import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt, STATUS_MAP } from '../../utils/formatters';
import { Search, Filter, User, CheckCircle, AlertTriangle } from 'lucide-react';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

export default function AdminRegistrations() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/users?role=participant&search=${search}&page=${page}`).catch(() => ({ users: [], total: 0 })),
      api.get('/registration/logs').catch(() => []),
    ]).then(([res, logRes]) => {
      setUsers(res.users || []);
      setTotal(res.total || 0);
      setLogs(logRes || []);
    }).finally(() => setLoading(false));
  }, [search, page]);

  const filtered = filter === 'flagged' ? logs.filter((l) => l.flagged) : filter === 'verified' ? logs.filter((l) => !l.flagged) : logs;

  const handleReview = async (userId, action) => {
    try {
      await api.patch(`/users/${userId}/status`, { active: action === 'activate' });
      toast.success(`User ${action === 'activate' ? 'activated' : 'deactivated'}`);
      setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, isActive: action === 'activate' } : u));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Registrations</h1>
            <p className="page-subtitle">AI-validated participant registrations — {total} total</p>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Total Registered</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--danger)' }}>{logs.filter((l) => l.flagged).length}</div>
            <div className="stat-label">Flagged</div>
            <div className="stat-sub">Require review</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {total > 0 ? Math.round(((total - logs.filter((l) => l.flagged).length) / total) * 100) : 100}%
            </div>
            <div className="stat-label">Verification Rate</div>
          </div>
        </div>

        <div className="admin-layout-grid">
          <div style={{ minWidth: 0 }}>
            <div className="card card-sm" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['all', 'verified', 'flagged'].map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} style={{ textTransform: 'capitalize' }}>{f}</button>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} type="list" height={80} />
                  ))}
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>University</th>
                        <th>Skills</th>
                        <th>Experience</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 0 }}>
                            <EmptyState
                              title="No Participants Found"
                              subtitle="No registered participants match the search query or selected filters."
                              icon="User"
                            />
                          </td>
                        </tr>
                      ) : users.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand-light)', flexShrink: 0 }}>
                                {fmt.initials(u.name)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.institution || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {(u.skills || []).slice(0, 3).map((s) => <span key={s} className="badge badge-muted" style={{ fontSize: 10 }}>{s}</span>)}
                              {(u.skills || []).length > 3 && <span className="badge badge-muted" style={{ fontSize: 10 }}>+{u.skills.length - 3}</span>}
                            </div>
                          </td>
                          <td><span className="badge badge-primary" style={{ textTransform: 'capitalize', fontSize: 11 }}>{u.experience}</span></td>
                          <td>
                            {u.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Suspended</span>}
                          </td>
                          <td>
                            <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleReview(u._id, u.isActive ? 'deactivate' : 'activate')}>
                              {u.isActive ? 'Suspend' : 'Reinstate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {total > 50 && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>Page {page} of {Math.ceil(total / 50)}</span>
                  <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>AI Validation Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 600, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2, 3].map((i) => (
                    <SkeletonCard key={i} type="list" height={100} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title="No Validation Logs"
                  subtitle="No validations or activity have been recorded in the registration log yet."
                  icon="AlertTriangle"
                />
              ) : (
                filtered.slice(0, 20).map((l) => (
                  <div key={l._id} style={{ padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius)', border: `1px solid ${l.flagged ? 'rgba(239,68,68,0.25)' : 'var(--border)'}` }}>
                    <div className="flex-between" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{l.email || l.userId?.email}</span>
                      {l.flagged
                        ? <span className="badge badge-danger" style={{ fontSize: 10 }}>Flagged</span>
                        : <span className="badge badge-success" style={{ fontSize: 10 }}>Clear</span>}
                    </div>
                    {l.skillsExtracted?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                        {l.skillsExtracted.slice(0, 4).map((s) => <span key={s} className="badge badge-muted" style={{ fontSize: 10 }}>{s}</span>)}
                      </div>
                    )}
                    {l.duplicateScore > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--danger)' }}>
                        Duplicate score: {fmt.pct(l.duplicateScore)}
                      </div>
                    )}
                    {l.fraudScore > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--warning)' }}>
                        Fraud score: {fmt.pct(l.fraudScore)}
                      </div>
                    )}
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>{fmt.datetime(l.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
