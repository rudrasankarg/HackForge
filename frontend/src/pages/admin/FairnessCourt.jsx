import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import { Scale, ShieldAlert, Users, TrendingDown, BookOpen, AlertTriangle, Sparkles, Loader2, X, MessageSquare, Award } from 'lucide-react';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

export default function FairnessCourt() {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [loading, setLoading] = useState(true);
  const [verdictData, setVerdictData] = useState(null);
  const [fetchingVerdict, setFetchingVerdict] = useState(false);
  const [activeDebate, setActiveDebate] = useState(null);
  const [loadingDebate, setLoadingDebate] = useState(false);
  const [showDebateModal, setShowDebateModal] = useState(false);

  const handleConveneDebate = async (projectId, projectTitle) => {
    setLoadingDebate(true);
    setShowDebateModal(true);
    setActiveDebate({ projectTitle });
    try {
      let data;
      try {
        data = await api.get(`/ai-evaluation/project/${projectId}/jury-debate`);
      } catch (err) {
        if (err.status === 404) {
          // If not found, trigger it
          data = await api.post(`/ai-evaluation/project/${projectId}/jury-debate`, { projectId });
        } else {
          throw err;
        }
      }
      setActiveDebate({
        projectTitle,
        projectId,
        transcript: data.transcript,
        consensusScore: data.consensusScore,
        verdictSummary: data.verdictSummary
      });
    } catch (err) {
      toast.error('Failed to run or retrieve Jury Debate.');
      setShowDebateModal(false);
    } finally {
      setLoadingDebate(false);
    }
  };

  const handleRegenerateDebate = async (projectId, projectTitle) => {
    setLoadingDebate(true);
    try {
      const data = await api.post(`/ai-evaluation/project/${projectId}/jury-debate`, { projectId });
      setActiveDebate({
        projectTitle,
        projectId,
        transcript: data.transcript,
        consensusScore: data.consensusScore,
        verdictSummary: data.verdictSummary
      });
      toast.success('AI Jury Debate re-convened successfully!');
    } catch (err) {
      toast.error('Failed to re-convene AI Jury Debate.');
    } finally {
      setLoadingDebate(false);
    }
  };

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
                        <div className="flex-between" style={{ marginTop: 10, flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', opacity: 0.7 }}>Scores given: [{i.scores}]</div>
                          {i.projectId && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: 11 }}
                              onClick={() => handleConveneDebate(i.projectId, i.projectTitle)}
                            >
                              <Sparkles size={12} style={{ color: 'var(--brand-light)' }} /> Convene Jury Debate
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* AI Jury Debate Modal */}
      {showDebateModal && activeDebate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid var(--border)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                  <Scale size={18} style={{ color: 'var(--brand)' }} /> AI Jury Debate™
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  Project: <strong style={{ color: 'var(--brand-light)' }}>{activeDebate.projectTitle}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowDebateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 20, overflowY: 'auto', flex: 1, background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loadingDebate ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12 }}>
                  <Loader2 className="animate-spin" size={32} style={{ color: 'var(--brand)' }} />
                  <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-secondary)' }}>Simulating virtual jury debate...</p>
                </div>
              ) : activeDebate.transcript ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {activeDebate.transcript.map((t, idx) => {
                      // Color coding for each judge role
                      let color = 'var(--brand)';
                      let bg = 'var(--brand-dim)';
                      if (t.role?.toLowerCase().includes('ux') || t.judge?.includes('Pixel')) {
                        color = '#ec4899';
                        bg = 'rgba(236,72,153,0.1)';
                      } else if (t.role?.toLowerCase().includes('business') || t.role?.toLowerCase().includes('calibrator') || t.judge?.includes('Venture')) {
                        color = '#eab308';
                        bg = 'rgba(234,179,8,0.1)';
                      }

                      return (
                        <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: bg,
                            color: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontWeight: 700,
                            fontSize: 14,
                            border: `1px solid ${color}40`
                          }}>
                            {t.judge?.charAt(0) || 'J'}
                          </div>
                          <div style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: 12, borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                              <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{t.judge}</strong>
                              <span style={{ fontSize: 11, color: color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.role}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{t.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

                  {/* Consensus score & summary */}
                  <div style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)', border: '1px solid var(--brand-border)', borderRadius: 8, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '10px 14px', background: 'var(--brand-dim)', borderRadius: 8, border: '1px solid var(--brand-border)', minWidth: 80 }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-light)' }}>{activeDebate.consensusScore}</div>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Out of 50</div>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                        <Award size={15} style={{ color: 'var(--brand)' }} /> Jury Consensus Verdict
                      </h4>
                      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-secondary)' }}>{activeDebate.verdictSummary}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Failed to load debate details.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowDebateModal(false)}
              >
                Close Window
              </button>
              {!loadingDebate && activeDebate.projectId && (
                <button
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => handleRegenerateDebate(activeDebate.projectId, activeDebate.projectTitle)}
                >
                  <Sparkles size={13} /> Re-convene Debate
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
