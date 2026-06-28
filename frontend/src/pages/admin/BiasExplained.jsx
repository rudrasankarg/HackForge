import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { 
  Scale, AlertTriangle, Users, Cpu, Layers, Globe, 
  HelpCircle, CheckCircle, ArrowRight, ShieldAlert, Sparkles 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminBiasExplained() {
  // Live stats from backend
  const [alerts, setAlerts] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Interactive Z-score simulator state
  const [reviewerD, setReviewerD] = useState(72);

  useEffect(() => {
    api.get('/analytics/bias-alerts')
      .then((res) => {
        setAlerts(Array.isArray(res) ? res : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingStats(false));
  }, []);

  const handleResolveAlert = async (alertId) => {
    try {
      await api.put(`/analytics/bias-alerts/${alertId}/resolve`);
      toast.success('Bias anomaly resolved successfully.');
      const res = await api.get('/analytics/bias-alerts');
      setAlerts(Array.isArray(res) ? res : []);
    } catch (err) {
      toast.error('Failed to resolve bias alert.');
    }
  };

  // Compute live simulator Z-Scores
  // Reviewers: A (70), B (75), C (68), D (User value), E (70)
  const scores = [70, 75, 68, reviewerD, 70];
  const mean = parseFloat((scores.reduce((a, b) => a + b, 0) / 5).toFixed(2));
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 5;
  const stdDev = parseFloat(Math.sqrt(variance).toFixed(2)) || 1;
  const zScores = scores.map(s => parseFloat(((s - mean) / stdDev).toFixed(2)));

  const isAlertFired = Math.abs(zScores[3]) > 1.5;

  const chartData = [
    { name: 'Reviewer A', Score: 70, ZScore: zScores[0] },
    { name: 'Reviewer B', Score: 75, ZScore: zScores[1] },
    { name: 'Reviewer C', Score: 68, ZScore: zScores[2] },
    { name: 'Reviewer D (You)', Score: reviewerD, ZScore: zScores[3] },
    { name: 'Reviewer E', Score: 70, ZScore: zScores[4] },
  ];

  // Calculate stats from live data
  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter(a => !a.resolved).length;
  const activeBiasCount = alerts.filter(a => !a.resolved).length;

  const dimCounts = {};
  alerts.forEach(a => {
    dimCounts[a.dimension] = (dimCounts[a.dimension] || 0) + 1;
  });
  let topDimension = 'None';
  let maxCount = 0;
  Object.keys(dimCounts).forEach(dim => {
    if (dimCounts[dim] > maxCount) {
      maxCount = dimCounts[dim];
      topDimension = dim;
    }
  });

  const dimensionFormat = (dim) => {
    if (!dim || dim === 'None') return 'N/A';
    return dim.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const biasDimensions = [
    {
      icon: <Scale size={18} style={{ color: 'var(--brand-light)' }} />,
      name: 'Reviewer Outlier (Z-Score)',
      desc: 'Detects if a particular reviewer grades systematically higher or lower than the panel average.',
      method: 'Computes each score\'s deviation from the reviewer group mean in terms of standard deviation units (Z-score).',
      trigger: 'A reviewer consistently awards grades outside 1.8 standard deviations from the team average.'
    },
    {
      icon: <Cpu size={18} style={{ color: 'var(--accent)' }} />,
      name: 'Technology Stack Bias',
      desc: 'Checks if project scores correlate heavily with specific development frameworks or programming languages.',
      method: 'Runs correlation matrices between popular keywords in techStacks and the normalized project scores.',
      trigger: 'Projects containing "Solidity" or "AI" are rated 25% higher on average than equivalent projects on "PHP".'
    },
    {
      icon: <Users size={18} style={{ color: 'var(--success)' }} />,
      name: 'Gender Bias',
      desc: 'Monitors score distributions against the demographic gender configurations of team members.',
      method: 'Performs statistical significance tests comparing average scores of female, male, and mixed teams.',
      trigger: 'Submissions led by male participants receive significantly higher subjective ratings on the identical rubric.'
    },
    {
      icon: <Globe size={18} style={{ color: 'var(--warning)' }} />,
      name: 'Geographic Bias',
      desc: 'Ensures that a participant\'s country of origin or location does not influence their scores.',
      method: 'Groups final evaluation results by region and searches for statistically improbable variances.',
      trigger: 'Teams located in developing nations receive a lower average score compared to teams in Western regions.'
    },
    {
      icon: <Layers size={18} style={{ color: 'var(--info)' }} />,
      name: 'Institutional Bias',
      desc: 'Guards against prestige bias favoring famous schools or universities over lesser-known colleges.',
      method: 'Tracks scoring correlations against a pre-indexed rank list of academic institutions.',
      trigger: 'A reviewer scores IIT or Ivy League submissions 15% higher than local state college teams.'
    }
  ];

  return (
    <div className="app-shell">
      <Sidebar biasAlertCount={activeBiasCount} />
      <main className="main-content">
        
        {/* Section 1 — Hero / Intro */}
        <div className="page-header" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ padding: '4px 10px', background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', borderRadius: 99, fontSize: 11, fontWeight: 700, color: 'var(--brand-light)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={11} /> AI Fairness Engine
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: 26, fontWeight: 800 }}>Bias Detection & Fairness report</h1>
          <p className="page-subtitle" style={{ maxWidth: 800, color: 'var(--text-secondary)' }}>
            HackForge integrates automated auditing tools that inspect judging profiles and score patterns in real-time. By applying statistical outlier verification, we protect participants and promote meritocracy.
          </p>
        </div>

        {/* Section 2 — The 5 Bias Dimensions */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            5 Audited Bias Dimensions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {biasDimensions.map((dim, index) => (
              <div key={index} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                    {dim.icon}
                  </div>
                  <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>{dim.name}</h3>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{dim.desc}</p>
                <div style={{ background: 'var(--bg-base)', padding: 12, borderRadius: 6, border: '1px solid var(--border)', marginTop: 'auto' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>How it works</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>{dim.method}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: 4 }}>Trigger Example</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>"{dim.trigger}"</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 — How Z-Score Detection Works (visual explainer) */}
        <div className="grid-2" style={{ gap: 24, marginBottom: 36, alignItems: 'start' }}>
          <div className="card no-text-cursor">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Interactive Z-Score Simulator</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
              Use the slider to drag Reviewer D's score and observe how standard deviation and Z-scores update dynamically. If Reviewer D's Z-Score deviates beyond ±1.5, a statistical anomaly bias alert triggers!
            </p>

            <div style={{ background: 'var(--bg-base)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Adjust Reviewer D's Score</span>
                <span className="mono" style={{ color: 'var(--brand-light)', fontWeight: 700, fontSize: 14 }}>{reviewerD} Points</span>
              </div>
              <input 
                type="range" 
                min="15" 
                max="100" 
                value={reviewerD} 
                onChange={(e) => setReviewerD(Number(e.target.value))} 
                className="score-slider" 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                <span>15 (Very Low)</span>
                <span>100 (Maximum)</span>
              </div>
            </div>

            <div style={{ 
              padding: 16, 
              borderRadius: 8, 
              background: isAlertFired ? 'var(--danger-dim)' : 'var(--success-dim)', 
              border: `1px solid ${isAlertFired ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
              color: isAlertFired ? 'var(--danger)' : 'var(--success)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                <ShieldAlert size={16} /> 
                Reviewer D Z-Score: {zScores[3]}
              </div>
              <p style={{ fontSize: 12.5, color: isAlertFired ? 'var(--danger)' : 'var(--success)', opacity: 0.9, lineHeight: 1.4 }}>
                {isAlertFired 
                  ? `🚨 Alert Active: Reviewer D's rating is ${Math.abs(zScores[3])} standard deviations from the mean. This grader is flagged as a statistical outlier.`
                  : `✅ Status Normal: Reviewer D's rating is aligned with the group scoring patterns.`
                }
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: 24, minHeight: 330 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>Live Reviewer Score Deviations</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" domain={[0, 100]} fontSize={10} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8 }} 
                  labelStyle={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}
                  itemStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="Score" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const z = Math.abs(entry.ZScore);
                    const color = index === 3 
                      ? (z > 1.5 ? 'var(--danger)' : 'var(--brand-light)')
                      : 'var(--bg-overlay)';
                    return <Cell key={`cell-${index}`} fill={color} stroke="var(--border)" strokeWidth={1} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 4 — What Happens When a Bias Alert Fires */}
        <div className="card" style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Alert lifecycle & Workflow
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, position: 'relative' }}>
            {[
              { step: '1', title: 'Anomaly Triggered', desc: 'The grading engine intercepts score distributions and computes outlier metrics.' },
              { step: '2', title: 'Dashboard Logged', desc: 'Real-time WebSocket dispatch notifications increment the admin bias counts.' },
              { step: '3', title: 'Audit Trail Stored', desc: 'System saves detailed z-score records, affected reviewers, and project metadata.' },
              { step: '4', title: 'Admin Resolution', desc: 'Organizer reviews statistical evidence and can normalize scores or adjust assignments.' }
            ].map((s, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-elevated)', padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', color: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {s.step}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>{s.title}</div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5 — Live Stats (pull from existing bias data) */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Engine Status & Historical Statistics
          </h2>
          <div className="grid-3">
            <div className="stat-card">
              <div className="stat-label">Total Bias Alerts Logged</div>
              {loadingStats ? (
                <div style={{ marginTop: 8 }}><div className="spinner" /></div>
              ) : (
                <div className="stat-value" style={{ color: 'var(--text-primary)', marginTop: 8 }}>{totalAlerts}</div>
              )}
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Active Unresolved Alerts</div>
              {loadingStats ? (
                <div style={{ marginTop: 8 }}><div className="spinner" /></div>
              ) : (
                <div className="stat-value" style={{ color: activeAlerts > 0 ? 'var(--danger)' : 'var(--success)', marginTop: 8 }}>{activeAlerts}</div>
              )}
            </div>

            <div className="stat-card">
              <div className="stat-label">Frequent Anomaly Category</div>
              {loadingStats ? (
                <div style={{ marginTop: 8 }}><div className="spinner" /></div>
              ) : (
                <div className="stat-value" style={{ color: 'var(--accent)', marginTop: 8, fontSize: topDimension !== 'None' ? 20 : 28 }}>
                  {dimensionFormat(topDimension)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Unresolved Alerts list */}
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Unresolved Alerts
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.filter(a => !a.resolved).length === 0 ? (
              <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                No active bias anomalies detected. All grading systems are fully aligned!
              </div>
            ) : (
              alerts.filter(a => !a.resolved).map((alert) => (
                <div key={alert._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderLeft: `4px solid var(--${alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info'})` }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span className={`badge badge-${alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info'}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>
                        {alert.severity} Priority
                      </span>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        {dimensionFormat(alert.dimension)} Anomaly
                      </strong>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: 13, color: 'var(--text-secondary)' }}>{alert.description}</p>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Detail: {alert.statisticalDetail}
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ border: '1px solid var(--border)', padding: '6px 12px', fontSize: 12 }}
                    onClick={() => handleResolveAlert(alert._id)}
                  >
                    Resolve Alert
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
