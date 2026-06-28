import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { BarChart3, Users, FolderOpen, Star, TrendingUp } from 'lucide-react';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics').then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="app-shell"><Sidebar /><main className="main-content"><div className="loading-screen"><div className="spinner" /></div></main></div>;

  const stats = data || {};

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Platform metrics and insights</p>
        </div>

        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Participants', value: stats.participants?.total ?? '—', icon: Users, color: 'var(--brand-light)' },
            { label: 'Projects', value: stats.projects?.total ?? '—', icon: FolderOpen, color: 'var(--accent)' },
            { label: 'Evaluations', value: stats.evaluations?.completed ?? '—', icon: Star, color: 'var(--success)' },
            { label: 'Avg Score', value: stats.evaluations?.avgScore ? Number(stats.evaluations.avgScore).toFixed(1) : '—', icon: TrendingUp, color: 'var(--warning)' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <s.icon size={20} style={{ color: s.color, marginBottom: 8 }} />
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {stats.topDomains && (
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Top Domains</h3>
            {stats.topDomains.map((d, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div className="flex-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5 }}>{d._id || 'Unspecified'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.count} projects</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${(d.count / (stats.projects?.total || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {stats.topSkills && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Top Participant Skills</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {stats.topSkills.map((s, i) => (
                <span key={i} className="badge badge-primary" style={{ fontSize: 12.5, padding: '5px 12px' }}>
                  {s._id} <span style={{ opacity: 0.7 }}>({s.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
