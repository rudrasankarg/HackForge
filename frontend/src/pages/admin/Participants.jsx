import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { Users, Search, UserCheck, UserX } from 'lucide-react';
import { toast } from '../../utils/toast';

export default function Participants() {
  const [data, setData] = useState({ users: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 40 });
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      const res = await api.get(`/users?${params}`);
      setData(res);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, role]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load(); };

  const changeRole = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setData((prev) => ({ ...prev, users: prev.users.map((u) => u._id === userId ? { ...u, role: newRole } : u) }));
      toast.success(`Role updated successfully to ${newRole}`);
    } catch (err) { toast.error(err.message); } finally { setActionLoading(''); }
  };

  const toggleStatus = async (userId, current) => {
    setActionLoading(userId + 'status');
    try {
      await api.patch(`/users/${userId}/status`);
      setData((prev) => ({ ...prev, users: prev.users.map((u) => u._id === userId ? { ...u, isActive: !current } : u) }));
      toast.success(current ? 'Account suspended successfully' : 'Account activated successfully');
    } catch (err) { toast.error(err.message); } finally { setActionLoading(''); }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Participants</h1>
            <p className="page-subtitle">{data.total} accounts registered</p>
          </div>
        </div>

        <div className="card card-sm" style={{ marginBottom: 20 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width: 160 }} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
              <option value="">All roles</option>
              <option value="participant">Participant</option>
              <option value="reviewer">Reviewer</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm"><Search size={14} /> Search</button>
          </form>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Institution</th>
                  <th>Role</th>
                  <th>Skills</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : data.users.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.email}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{p.university || p.institution || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      <span className={`badge ${p.role === 'reviewer' ? 'badge-accent' : p.role === 'admin' ? 'badge-primary' : 'badge-muted'}`}>
                        {p.role}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.skills?.slice(0, 2).map((s) => <span key={s} className="badge badge-muted">{s}</span>)}
                        {(p.skills?.length || 0) > 2 && <span className="badge badge-muted">+{p.skills.length - 2}</span>}
                      </div>
                    </td>
                    <td>
                      {p.emailVerified ? <span className="badge badge-success">Verified</span> : <span className="badge badge-danger">Unverified</span>}
                    </td>
                    <td>
                      {p.isActive ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Suspended</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {p.role !== 'admin' && (
                          <button
                            className="btn btn-sm btn-secondary"
                            disabled={actionLoading === p._id}
                            onClick={() => changeRole(p._id, p.role === 'reviewer' ? 'participant' : 'reviewer')}
                            title={p.role === 'reviewer' ? 'Demote to participant' : 'Promote to reviewer'}
                          >
                            {p.role === 'reviewer' ? <UserX size={13} /> : <UserCheck size={13} />}
                            {p.role === 'reviewer' ? 'Demote' : 'Make Reviewer'}
                          </button>
                        )}
                        {p.role !== 'admin' && (
                          <button
                            className={`btn btn-sm ${p.isActive ? 'btn-danger' : 'btn-success'}`}
                            disabled={actionLoading === p._id + 'status'}
                            onClick={() => toggleStatus(p._id, p.isActive)}
                          >
                            {p.isActive ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {data.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
