import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';
import { fmt } from '../../utils/formatters';
import { Brain, Star, FileText, Send, Loader2, Sparkles, LayoutDashboard, ChevronRight } from 'lucide-react';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

export default function AiProjectEvaluation() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [evaluations, setEvaluations] = useState({}); // projectId -> evaluation doc
  const [runningEval, setRunningEval] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed

  const fetchProjectsAndEvaluations = async () => {
    setLoading(true);
    try {
      const projList = await api.get('/projects');
      setProjects(projList || []);

      // Batch fetch evaluations for all projects
      const evalMap = {};
      for (const p of projList || []) {
        try {
          const evalDoc = await api.get(`/ai-evaluation/project/${p._id}`);
          if (evalDoc) {
            evalMap[p._id] = evalDoc;
          }
        } catch {
          // ignore 404s
        }
      }
      setEvaluations(evalMap);
    } catch (err) {
      toast.error('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsAndEvaluations();
  }, []);

  const handleRunAiEvaluation = async (projectId) => {
    setRunningEval(projectId);
    try {
      const res = await api.post('/ai-evaluation/evaluate', { projectId });
      setEvaluations(prev => ({ ...prev, [projectId]: res }));
      toast.success('AI Evaluation generated successfully!');
      if (selectedProject?._id === projectId) {
        setSelectedProject(prev => ({ ...prev })); // trigger redraw of details
      }
    } catch (err) {
      toast.error(err.message || 'AI Evaluation run failed.');
    } finally {
      setRunningEval(null);
    }
  };

  const handleSendEmail = async (projectId) => {
    setSendingEmail(projectId);
    try {
      const res = await api.post(`/ai-evaluation/project/${projectId}/send`);
      setEvaluations(prev => ({ ...prev, [projectId]: res.evaluation }));
      toast.success('Report emailed to all team members!');
    } catch (err) {
      toast.error(err.message || 'Failed to send email.');
    } finally {
      setSendingEmail(null);
    }
  };

  const filteredProjects = projects.filter(p => {
    const hasEval = !!evaluations[p._id];
    if (filter === 'pending') return !hasEval;
    if (filter === 'completed') return hasEval;
    return true;
  });

  const getOverallAvg = (scores) => {
    if (!scores) return 0;
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    return (total / 5).toFixed(1);
  };

  const currentEval = selectedProject ? evaluations[selectedProject._id] : null;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Brain style={{ color: 'var(--brand)' }} /> AI Project Evaluation
            </h1>
            <p className="page-subtitle">
              {user?.role === 'reviewer'
                ? 'Critique your assigned projects using dynamic multidimensional Gemini screening.'
                : 'Automated AI scoring, strength-weakness assessment, and direct developer reporting.'}
            </p>
          </div>
        </div>

        <div className="admin-layout-grid" style={{ gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
          {/* Projects List Panel */}
          <div>
            <div className="card card-sm" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, width: '100%' }}>
                {[
                  { id: 'all', label: 'All Projects' },
                  { id: 'pending', label: 'Awaiting AI' },
                  { id: 'completed', label: 'AI Evaluated' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`btn btn-sm ${filter === f.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading ? (
                [1, 2, 3].map(i => <SkeletonCard key={i} type="list" height={100} />)
              ) : filteredProjects.length === 0 ? (
                <EmptyState
                  title="No Projects Found"
                  subtitle="No projects match this category."
                  icon="Brain"
                />
              ) : (
                filteredProjects.map(p => {
                  const isSelected = selectedProject?._id === p._id;
                  const evaluation = evaluations[p._id];
                  const hasScores = !!evaluation?.scores;
                  const isRunning = runningEval === p._id;

                  return (
                    <div
                      key={p._id}
                      onClick={() => setSelectedProject(p)}
                      className="card"
                      style={{
                        padding: 16,
                        cursor: 'pointer',
                        borderColor: isSelected ? 'var(--brand)' : 'var(--border)',
                        background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                        boxShadow: isSelected ? '0 0 12px rgba(234, 88, 12, 0.15)' : 'none',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {p.title}
                        </h3>
                        <ChevronRight size={16} style={{ opacity: 0.6 }} />
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                        Team: <strong>{p.teamName}</strong> | Domain: <strong>{p.domain || 'General'}</strong>
                      </p>

                      <div className="flex-between">
                        <div style={{ display: 'flex', gap: 8 }}>
                          {hasScores ? (
                            <span className="badge badge-success" style={{ fontWeight: 700 }}>
                              AI Score: {getOverallAvg(evaluation.scores)}/10
                            </span>
                          ) : (
                            <span className="badge badge-muted">Not Evaluated</span>
                          )}
                          {evaluation?.sentToTeam && (
                            <span className="badge badge-primary">Report Sent</span>
                          )}
                        </div>

                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={isRunning}
                          style={{
                            background: isRunning ? 'var(--bg-base)' : 'var(--brand-dim)',
                            border: `1px solid ${isRunning ? 'var(--border)' : 'var(--brand-border)'}`,
                            color: 'var(--brand-light)'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunAiEvaluation(p._id);
                          }}
                        >
                          {isRunning ? (
                            <>
                              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', marginRight: 4 }} />
                              Running...
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} style={{ marginRight: 4 }} />
                              Run AI
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Details & Report Panel */}
          <div>
            {!selectedProject ? (
              <div className="card" style={{ height: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Brain size={44} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: 14 }}>Select a project to inspect and generate AI evaluation report.</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 24 }}>
                <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px 0' }}>{selectedProject.title}</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                      Team: {selectedProject.teamName} &middot; Tech: {selectedProject.techStack?.join(', ') || 'N/A'}
                    </p>
                  </div>
                  {currentEval && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSendEmail(selectedProject._id)}
                      disabled={sendingEmail === selectedProject._id}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {sendingEmail === selectedProject._id ? (
                        <Loader2 size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                      ) : (
                        <Send size={14} />
                      )}
                      {currentEval.sentToTeam ? 'Resend to Team' : 'Email to Team'}
                    </button>
                  )}
                </div>

                {!currentEval ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <Sparkles size={36} style={{ color: 'var(--brand)', margin: '0 auto 12px auto', opacity: 0.8 }} />
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
                      This project has not been evaluated by AI models yet. Run the evaluation to check code complexity, feasibility, and score breakdown.
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleRunAiEvaluation(selectedProject._id)}
                      disabled={runningEval === selectedProject._id}
                    >
                      {runningEval === selectedProject._id ? (
                        <>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
                          Running Automated Assessment...
                        </>
                      ) : (
                        <>
                          <Brain size={16} style={{ marginRight: 8 }} />
                          Generate Evaluation Report
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Score Gauges */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
                      {Object.entries(currentEval.scores || {}).map(([key, score]) => (
                        <div key={key} style={{ padding: '10px 8px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-light)' }}>{score}</div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4, letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {key}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Strengths & Improvements */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 6 }}>Key Strength</div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{currentEval.strengths}</p>
                      </div>
                      <div style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: 6 }}>Suggested Improvement</div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{currentEval.improvements}</p>
                      </div>
                    </div>

                    {/* Detailed Analysis Markdown */}
                    <div style={{ padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Detailed Assessment</div>
                      <div
                        className="markdown-body"
                        style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}
                      >
                        {/* We will output clean line-breaks to keep styling simple */}
                        {currentEval.detailedAnalysis?.split('\n').map((line, idx) => {
                          const cleanLine = line.replace(/^\s*[-*+]\s+/, '• ');
                          const replaceBold = (text) => {
                            const parts = text.split(/\*\*([^*]+)\*\*/g);
                            return parts.map((part, index) => {
                              return index % 2 === 1 ? <strong key={index}>{part}</strong> : part;
                            });
                          };

                          if (cleanLine.startsWith('###')) {
                            return <h4 key={idx} style={{ color: 'var(--text-primary)', margin: '14px 0 6px 0', fontSize: 14, fontWeight: 700 }}>{replaceBold(cleanLine.replace('###', ''))}</h4>;
                          }
                          if (cleanLine.startsWith('##')) {
                            return <h3 key={idx} style={{ color: 'var(--text-primary)', margin: '16px 0 8px 0', fontSize: 15, fontWeight: 800 }}>{replaceBold(cleanLine.replace('##', ''))}</h3>;
                          }
                          return <p key={idx} style={{ margin: '0 0 10px 0' }}>{replaceBold(cleanLine)}</p>;
                        })}

                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
