import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import { Scale, ShieldAlert, Users, TrendingDown, BookOpen, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

export default function FairnessCourt() {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [loading, setLoading] = useState(true);
  const [verdictData, setVerdictData] = useState(null);
  const [fetchingVerdict, setFetchingVerdict] = useState(false);

  useEffect(() => {
    api.get('/hackathons')
      .then(res => {
        setHackathons(res || []);
        if (res?.length > 0) {
          setSelectedHackathon(res[0]._id);
        }
      })
      .catch(() => toast.error('Failed to load hackathons.'))
      .finally(() => setLoading(false));
  }, []);

  const fetchVerdict = async (hackathonId) => {
    if (!hackathonId) return;
    setFetchingVerdict(true);
    try {
      const res = await api.get(`/ai-evaluation/hackathon/${hackathonId}/fairness-court`);
      setVerdictData(res);
    } catch (err) {
      toast.error('Failed to fetch Fairness Court Verdict.');
    } finally {
      setFetchingVerdict(false);
    }
  };

  useEffect(() => {
    if (selectedHackathon) {
      fetchVerdict(selectedHackathon);
    }
  }, [selectedHackathon]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Scale style={{ color: 'var(--brand)' }} /> AI Fairness Court™
            </h1>
            <p className="page-subtitle">AI-powered checks on reviewer outliers, scoring bias patterns, and ranking instability.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              className="form-select"
              style={{ width: 220 }}
              value={selectedHackathon}
              onChange={(e) => setSelectedHackathon(e.target.value)}
            >
              <option value="">Select Hackathon</option>
              {hackathons.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading || fetchingVerdict ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonCard type="list" height={140} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <SkeletonCard type="list" height={280} />
              <SkeletonCard type="list" height={280} />
            </div>
          </div>
        ) : !selectedHackathon ? (
          <EmptyState
            title="Select Hackathon"
            subtitle="Please select a hackathon from the dropdown menu to inspect fairness logs."
            icon="Scale"
          />
        ) : !verdictData || verdictData.stats?.totalEvaluations === 0 ? (
          <EmptyState
            title="Insufficient Evaluation Data"
            subtitle="At least one completed evaluation is required for the court to analyze bias patterns."
            icon="Scale"
          />
        ) : (
          <div>
            {/* Quick Stat Bar */}
            <div className="grid-3" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-value">{verdictData.stats.totalProjects}</div>
                <div className="stat-label">Total Projects</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--brand-light)' }}>{verdictData.stats.totalEvaluations}</div>
                <div className="stat-label">Evaluations Audited</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--success)' }}>{verdictData.stats.averageScore}/50</div>
                <div className="stat-label">Average Audited Score</div>
              </div>
            </div>

            {/* Main Court Verdict Banner */}
            <div
              className="card"
              style={{
                marginBottom: 24,
                border: '1px solid var(--brand-border)',
                background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  fontSize: 100,
                  opacity: 0.05,
                  pointerEvents: 'none',
                  fontFamily: 'Sora, sans-serif',
                  fontWeight: 900
                }}
              >
                VERDICT
              </div>

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ padding: 12, background: 'var(--brand-dim)', borderRadius: 10, color: 'var(--brand-light)' }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--brand-light)', margin: '0 0 6px 0', letterSpacing: '0.08em', fontWeight: 800 }}>
                    AI Fairness Court™ Ruling
                  </h3>
                  <div
                    className="markdown-body"
                    style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-primary)' }}
                  >
                    {verdictData.verdict?.split('\n').map((line, idx) => {
                      const cleanLine = line.replace(/^\s*[-*+]\s+/, '• '); // convert markdown lists to bullet points
                      const replaceBold = (text) => {
                        const parts = text.split(/\*\*([^*]+)\*\*/g);
                        return parts.map((part, index) => {
                          return index % 2 === 1 ? <strong key={index}>{part}</strong> : part;
                        });
                      };

                      if (cleanLine.startsWith('###')) {
                        return <h5 key={idx} style={{ color: 'var(--text-primary)', margin: '14px 0 6px 0', fontSize: 14, fontWeight: 700 }}>{replaceBold(cleanLine.replace('###', ''))}</h5>;
                      }
                      if (cleanLine.startsWith('##')) {
                        return <h4 key={idx} style={{ color: 'var(--text-primary)', margin: '16px 0 8px 0', fontSize: 15, fontWeight: 800 }}>{replaceBold(cleanLine.replace('##', ''))}</h4>;
                      }
                      if (cleanLine.startsWith('#')) {
                        return <h3 key={idx} style={{ color: 'var(--text-primary)', margin: '18px 0 10px 0', fontSize: 16, fontWeight: 900 }}>{replaceBold(cleanLine.replace('#', ''))}</h3>;
                      }
                      return <p key={idx} style={{ margin: '0 0 8px 0' }}>{replaceBold(cleanLine)}</p>;
                    })}
                  </div>

                </div>
              </div>
            </div>

            {/* Columns for Outliers and Disagreement */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* Reviewer Outliers & Bias */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldAlert size={16} style={{ color: 'var(--warning)' }} /> Anomalies & Bias Warnings
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {verdictData.suspicious.length === 0 && verdictData.biasPatterns.length === 0 ? (
                    <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No reviewer scoring outliers or significant group biases detected.
                    </div>
                  ) : (
                    <>
                      {verdictData.suspicious.map((s, idx) => (
                        <div key={idx} style={{ padding: 14, background: 'var(--bg-surface)', border: `1px solid var(--border)`, borderLeft: '4px solid var(--danger)', borderRadius: '0 8px 8px 0' }}>
                          <span className="badge badge-danger" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>Outlier</span>
                          <h4 style={{ fontSize: 13.5, margin: '0 0 4px 0' }}>{s.reviewer}</h4>
                          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>{s.reason}</p>
                        </div>
                      ))}
                      {verdictData.biasPatterns.map((b, idx) => (
                        <div key={idx} style={{ padding: 14, background: 'var(--bg-surface)', border: `1px solid var(--border)`, borderLeft: '4px solid var(--warning)', borderRadius: '0 8px 8px 0' }}>
                          <span className="badge badge-warning" style={{ fontSize: 10, textTransform: 'uppercase', marginBottom: 6 }}>{b.dimension}</span>
                          <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: 0 }}>{b.message}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Ranking Instability / Disagreement */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingDown size={16} style={{ color: 'var(--danger)' }} /> Ranking Instability (Disagreed Projects)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {verdictData.instability.length === 0 ? (
                    <div className="card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                      Excellent reviewer alignment! No projects showed high score variance.
                    </div>
                  ) : (
                    verdictData.instability.map((i, idx) => (
                      <div key={idx} style={{ padding: 14, background: 'var(--bg-surface)', border: `1px solid var(--border)`, borderLeft: '4px solid var(--brand)', borderRadius: '0 8px 8px 0' }}>
                        <div className="flex-between" style={{ marginBottom: 6 }}>
                          <h4 style={{ fontSize: 13.5, margin: 0 }}>{i.projectTitle}</h4>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-light)' }}>SD: {i.stdDev}</span>
                        </div>
                        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>{i.message}</p>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.7 }}>Scores given: [{i.scores}]</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
