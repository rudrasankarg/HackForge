import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Github from './GithubIcon';
import { ShieldCheck, GitCommit, Code, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function GithubHealthAnalyzer({ projectId }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHealth = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/projects/${projectId}/github-health`);
      setHealth(data);
    } catch (err) {
      setError('Could not retrieve repository health diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchHealth();
  }, [projectId]);

  if (loading) return (
    <div className="card" style={{ padding: 20, textAlign: 'center' }}>
      <RefreshCw className="spinner" size={20} style={{ margin: '0 auto 10px auto', color: 'var(--brand)' }} />
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Analyzing GitHub repository health metrics...</p>
    </div>
  );

  if (error || !health) return (
    <div className="card" style={{ padding: 16, border: '1px solid rgba(220,38,38,0.1)', background: 'rgba(220,38,38,0.02)', display: 'flex', gap: 10, alignItems: 'center' }}>
      <AlertCircle size={16} color="var(--danger)" />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{error || 'No repository analytics available.'}</span>
    </div>
  );

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 80) return 'var(--brand)';
    return 'var(--danger)';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'var(--success-dim)';
    if (score >= 80) return 'var(--brand-dim)';
    return 'var(--danger-dim)';
  };

  return (
    <div className="card" style={{ padding: 22, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-surface)', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Github size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, fontFamily: 'Sora, sans-serif' }}>Repo Health Diagnostic</h4>
            <a href={health.repoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'underline' }}>
              {health.repoUrl.replace('https://github.com/', '')}
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Health Score</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: getScoreColor(health.healthScore) }}>{health.healthScore} <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/ 100</span></div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: 10, 
            background: getScoreBg(health.healthScore),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: getScoreColor(health.healthScore)
          }}>
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* Grid of stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Commits Count', value: health.commitsCount, icon: GitCommit, color: 'var(--brand)' },
          { label: 'Active Days', value: `${health.activeDays} days`, icon: ShieldCheck, color: 'var(--success)' },
          { label: 'Lines of Code', value: health.linesOfCode.toLocaleString(), icon: Code, color: 'var(--accent)' },
          { label: 'Issues Resolved', value: `${health.issuesClosed}/${health.issuesOpened}`, icon: AlertCircle, color: 'var(--warning)' },
        ].map((item, idx) => (
          <div key={idx} style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <item.icon size={13} color={item.color} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Languages bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
          <span>Code Distribution</span>
          <span style={{ textTransform: 'capitalize' }}>Status: {health.healthStatus}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden', background: 'var(--border)' }}>
          {Object.entries(health.languages).map(([lang, pct], idx) => {
            const colors = ['#f57a2b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899'];
            return (
              <div 
                key={lang} 
                style={{ width: `${pct}%`, background: colors[idx % colors.length] }} 
                title={`${lang}: ${pct}%`} 
              />
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          {Object.entries(health.languages).map(([lang, pct], idx) => {
            const colors = ['#f57a2b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899'];
            return (
              <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 500 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[idx % colors.length] }} />
                <span style={{ color: 'var(--text-primary)' }}>{lang}</span>
                <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
