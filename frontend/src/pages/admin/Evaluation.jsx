import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import { io } from 'socket.io-client';
import { AlertTriangle, CheckCircle, Activity, Shield } from 'lucide-react';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

export default function AdminEvaluation() {
  const [alerts, setAlerts] = useState([]);
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const dimensionColors = {
    scoring_pattern: { bg: 'rgba(124, 58, 237, 0.15)', text: '#a78bfa', label: 'Scoring Pattern' },
    gender_bias: { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', label: 'Gender Bias' },
    geographic_bias: { bg: 'rgba(20, 184, 166, 0.15)', text: '#2dd4bf', label: 'Geographic Bias' },
    institutional_bias: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', label: 'Institutional Bias' },
    tech_stack_bias: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', label: 'Tech Stack Bias' },
    gender: { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', label: 'Gender Bias' },
    geographic: { bg: 'rgba(20, 184, 166, 0.15)', text: '#2dd4bf', label: 'Geographic Bias' },
    institutional: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', label: 'Institutional Bias' },
    technology: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', label: 'Tech Stack Bias' },
    'reviewer-outlier': { bg: 'rgba(124, 58, 237, 0.15)', text: '#a78bfa', label: 'Scoring Pattern' }
  };

  const getDimensionStyle = (dim) => {
    return dimensionColors[dim] || { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', label: dim };
  };

  const severityStyles = {
    high: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', label: 'High' },
    medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', label: 'Medium' },
    low: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', label: 'Low' }
  };

  const getSeverityStyle = (sev) => {
    return severityStyles[sev] || { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', label: sev };
  };

  useEffect(() => {
    Promise.all([
      api.get('/analytics/bias-alerts').catch(() => []),
      api.get('/evaluations').catch(() => []),
    ]).then(([a, e]) => { setAlerts(a); setEvals(e); }).finally(() => setLoading(false));

    const socket = io('/', { query: { token: localStorage.getItem('hf_token') } });
    socket.on('bias-alert', (alert) => {
      setAlerts((prev) => [alert, ...prev]);
      toast.warning(`New ${alert.severity} bias alert: ${alert.dimension}`);
    });
    return () => socket.disconnect();
  }, []);

  const handleResolve = async (id) => {
    setResolving(id);
    try {
      const res = await api.put(`/analytics/bias-alerts/${id}/resolve`);
      setAlerts((prev) => prev.map((a) => a._id === id ? res : a));
      toast.success('Alert marked as resolved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResolving(null);
    }
  };

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  const severityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...activeAlerts].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const filteredActive = sorted.filter(alert => {
    const typeMatch = filterType === 'all' || alert.dimension === filterType;
    const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
    return typeMatch && severityMatch;
  });

  return (
    <div className="app-shell">
      <Sidebar biasAlertCount={activeAlerts.length} />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Bias Monitor</h1>
            <p className="page-subtitle">Real-time statistical anomaly detection across all reviewer scores</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeAlerts.length ? 'var(--danger)' : 'var(--success)', boxShadow: `0 0 8px ${activeAlerts.length ? 'var(--danger)' : 'var(--success)'}` }} />
            <span style={{ fontSize: 13, color: activeAlerts.length ? 'var(--danger)' : 'var(--success)' }}>
              {activeAlerts.length ? `${activeAlerts.length} Active Alert${activeAlerts.length > 1 ? 's' : ''}` : 'System Clear'}
            </span>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Evaluations', value: evals.length, color: 'var(--brand-light)', icon: Activity },
            { label: 'Active Alerts', value: activeAlerts.length, color: activeAlerts.length ? 'var(--danger)' : 'var(--success)', icon: AlertTriangle },
            { label: 'Resolved', value: resolvedAlerts.length, color: 'var(--success)', icon: CheckCircle },
            { label: 'Avg Score', value: evals.length ? (evals.reduce((s, e) => s + (e.totalScore || 0), 0) / evals.length).toFixed(1) : '—', color: 'var(--accent)', icon: Shield },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ color: s.color }}>
                <s.icon size={18} />
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <SkeletonCard type="list" height={360} />
            <SkeletonCard type="list" height={360} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeAlerts.length ? 'var(--danger)' : 'var(--success)', boxShadow: `0 0 6px ${activeAlerts.length ? 'var(--danger)' : 'var(--success)'}` }} />
                <h3 className="chart-title" style={{ marginBottom: 0 }}>Active Bias Alerts</h3>
              </div>
              
              {/* Filter bar */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, background: 'var(--bg-elevated)' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Filter by Type</label>
                  <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="all">All Types</option>
                    <option value="scoring_pattern">Scoring Pattern</option>
                    <option value="gender_bias">Gender Bias</option>
                    <option value="geographic_bias">Geographic Bias</option>
                    <option value="institutional_bias">Institutional Bias</option>
                    <option value="tech_stack_bias">Tech Stack Bias</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Filter by Severity</label>
                  <select 
                    value={filterSeverity} 
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 13 }}
                  >
                    <option value="all">All Severities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeAlerts.length === 0 ? (
                  <EmptyState
                    title="All Clear"
                    subtitle="Scoring patterns appear statistically normal across all submitted evaluations."
                    icon="CheckCircle"
                  />
                ) : filteredActive.length === 0 ? (
                  <EmptyState
                    title="No Matches"
                    subtitle="No active bias alerts match the current filter selection."
                    icon="AlertTriangle"
                  />
                ) : filteredActive.map((alert) => (
                  <div key={alert._id} className={`bias-alert ${alert.severity}`}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: 4, 
                          fontSize: 10, 
                          fontWeight: 700, 
                          background: getSeverityStyle(alert.severity).bg, 
                          color: getSeverityStyle(alert.severity).text,
                          textTransform: 'uppercase'
                        }}>
                          {getSeverityStyle(alert.severity).label}
                        </span>
                        
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: 4, 
                          fontSize: 10, 
                          fontWeight: 700, 
                          background: getDimensionStyle(alert.dimension).bg, 
                          color: getDimensionStyle(alert.dimension).text
                        }}>
                          {getDimensionStyle(alert.dimension).label}
                        </span>
                        
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{fmt.datetime(alert.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 6 }}>{alert.description}</p>
                      {(alert.zScore || alert.statisticalDetail) && (
                        <div style={{ fontSize: 11, fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '5px 8px', borderRadius: 4, display: 'inline-block', opacity: 0.85, marginTop: 4 }}>
                          {alert.zScore && `z=${alert.zScore}`}{alert.statisticalDetail && ` | ${alert.statisticalDetail}`}
                        </div>
                      )}
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: 8, alignSelf: 'flex-start', flexShrink: 0 }}
                      onClick={() => handleResolve(alert._id)}
                      disabled={resolving === alert._id}
                    >
                      {resolving === alert._id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : 'Resolve'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 className="chart-title" style={{ marginBottom: 0 }}>Evaluation Log</h3>
              </div>
              <div className="table-wrapper">
                {evals.length === 0 ? (
                  <div style={{ padding: 16 }}>
                    <EmptyState
                      title="No Evaluations Submitted"
                      subtitle="No evaluations submitted yet. Reviewers have been assigned but haven't scored any projects."
                      icon="Activity"
                    />
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Reviewer</th>
                        <th>Score</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evals.slice(0, 15).map((ev) => (
                        <tr key={ev._id}>
                          <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.projectId?.title || '—'}</td>
                          <td style={{ fontSize: 12 }}>{ev.reviewerId?.name || '—'}</td>
                          <td>
                            <span className="score-ring" style={{ width: 38, height: 38, fontSize: 12 }}>{ev.totalScore}</span>
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt.datetime(ev.submittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {resolvedAlerts.length > 0 && (
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 className="chart-title" style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>Resolved Alerts ({resolvedAlerts.length})</h3>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {resolvedAlerts.slice(0, 5).map((a) => (
                <div key={a._id} style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{a.dimension} Bias</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>{a.description?.slice(0, 60)}...</span>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: 10 }}>Resolved</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
