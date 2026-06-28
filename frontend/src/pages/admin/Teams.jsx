import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { UsersRound, Search } from 'lucide-react';

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/teams').then(setTeams).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.members?.some((m) => m.name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Teams</h1>
            <p className="page-subtitle">{teams.length} teams registered</p>
          </div>
        </div>

        <div className="card card-sm" style={{ marginBottom: 20 }}>
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search teams or members..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((t) => (
              <div key={t._id} className="card" style={{ padding: '18px 20px' }}>
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-light)', fontWeight: 700 }}>
                      <UsersRound size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lead: {t.leaderId?.name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge badge-muted">{t.members?.length} / {t.maxSize} members</span>
                    {t.projectId ? <span className="badge badge-success">Project submitted</span> : <span className="badge badge-warning">No submission</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {t.members?.map((m) => (
                    <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'var(--bg-elevated)', borderRadius: 99, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                        {m.name?.[0]}
                      </div>
                      {m.name}
                      {t.leaderId?._id === m._id && <span style={{ fontSize: 10, color: 'var(--brand-light)', fontWeight: 600 }}>Lead</span>}
                    </div>
                  ))}
                </div>

                {t.projectId && (
                  <div style={{ marginTop: 10, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    Project: <strong style={{ color: 'var(--text-primary)' }}>{t.projectId.title}</strong>
                    {t.projectId.rank && <> — Rank <strong style={{ color: 'var(--brand-light)' }}>#{t.projectId.rank}</strong></>}
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && <div className="empty-state"><UsersRound size={32} /><h3>No teams found</h3></div>}
          </div>
        )}
      </main>
    </div>
  );
}
