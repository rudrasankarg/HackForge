import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ExternalLink, ShieldOff, AlertTriangle } from 'lucide-react';
import Github from '../../components/GithubIcon';
import { toast } from '../../utils/toast';

const CRITERIA = [
  { key: 'innovation', label: 'Innovation', desc: 'Originality and creative approach to the problem' },
  { key: 'technical', label: 'Technical Depth', desc: 'Quality of implementation, complexity, and code quality' },
  { key: 'uiux', label: 'UI / UX', desc: 'User experience, design quality, and accessibility' },
  { key: 'feasibility', label: 'Feasibility', desc: 'Practical viability, scalability, and production readiness' },
  { key: 'impact', label: 'Impact', desc: 'Real-world impact and potential reach of the solution' },
];

export default function Evaluate() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ innovation: 5, technical: 5, uiux: 5, feasibility: 5, impact: 5, feedback: '' });
  const [success, setSuccess] = useState(false);
  const [biasAlert, setBiasAlert] = useState(null);
  const [bypassBiasCheck, setBypassBiasCheck] = useState(false);

  useEffect(() => {
    api.get('/evaluations/assigned').then((assignments) => {
      const found = assignments.find((a) => a.project?._id === projectId);
      if (!found) { setAccessDenied(true); setLoading(false); return; }
      setProject(found.project);
      if (found.evaluation) {
        setForm({ innovation: found.evaluation.scores?.innovation || 5, technical: found.evaluation.scores?.technical || 5, uiux: found.evaluation.scores?.uiux || 5, feasibility: found.evaluation.scores?.feasibility || 5, impact: found.evaluation.scores?.impact || 5, feedback: found.evaluation.feedback || '' });
        setSuccess(found.evaluated);
      }
      setLoading(false);
    }).catch(() => { setAccessDenied(true); setLoading(false); });
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!bypassBiasCheck && !biasAlert) {
      setSubmitting(true);
      try {
        const response = await api.post('/evaluations/check-bias', {
          projectId,
          score: totalScore
        });
        
        if (response.hasBiasWarning && response.warnings && response.warnings.length > 0) {
          setBiasAlert(response.warnings);
          setSubmitting(false);
          return;
        }
      } catch (err) {
        console.error('Pre-submit bias check failed:', err);
      }
    }

    submitDirectly();
  };

  const submitDirectly = async () => {
    setSubmitting(true);
    try {
      await api.post('/evaluations', {
        projectId,
        hackathonId: project.hackathonId,
        scores: { innovation: form.innovation, technical: form.technical, uiux: form.uiux, feasibility: form.feasibility, impact: form.impact },
        feedback: form.feedback,
      });
      setSuccess(true);
      toast.success("Evaluation submitted successfully!");
      setTimeout(() => navigate('/reviewer'), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
      setBiasAlert(null);
      setBypassBiasCheck(false);
    }
  };

  const submitAnyway = () => {
    submitDirectly();
  };

  const reviewScores = () => {
    setBiasAlert(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalScore = form.innovation + form.technical + form.uiux + form.feasibility + form.impact;

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  if (accessDenied) return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <ShieldOff size={40} style={{ color: 'var(--danger)', opacity: 1, marginBottom: 16 }} />
          <h3 style={{ color: 'var(--danger)' }}>Access Denied</h3>
          <p>This project is not assigned to you. You can only evaluate projects in your assignment list.</p>
        </div>
      </main>
    </div>
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Evaluate Project</h1>
          <p className="page-subtitle">Score across 5 dimensions — total out of 50</p>
        </div>

        {success && (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            <CheckCircle size={16} /> Evaluation submitted. Returning to dashboard...
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          <div className="card">
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Evaluation Rubric</h2>
            <form onSubmit={handleSubmit}>
              {CRITERIA.map((c) => (
                <div key={c.key} style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 12, userSelect: 'none' }}>
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.desc}</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--brand-light)', minWidth: 50, textAlign: 'right' }}>
                      {form[c.key]}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>/10</span>
                    </div>
                  </div>
                  <input
                    type="range" min="1" max="10"
                    value={form[c.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [c.key]: parseInt(e.target.value) }))}
                    className="score-slider"
                    disabled={success}
                  />
                </div>
              ))}

              <div className="form-group" style={{ marginTop: 20 }}>
                <label className="form-label">Written Feedback (required)</label>
                <textarea
                  className="form-textarea"
                  value={form.feedback}
                  onChange={(e) => setForm((p) => ({ ...p, feedback: e.target.value }))}
                  placeholder="Provide specific, constructive feedback. Highlight strengths and areas for improvement..."
                  rows={4}
                  disabled={success}
                />
              </div>

              {biasAlert && biasAlert.length > 0 && (
                <div 
                  className="alert alert-warning" 
                  style={{ 
                    marginTop: 20, 
                    marginBottom: 20, 
                    borderLeft: '4px solid var(--warning)', 
                    display: 'flex',
                    flexDirection: 'column', 
                    alignItems: 'stretch',
                    gap: 12,
                    padding: 16
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--warning)', marginBottom: 10 }}>Potential Bias Warnings Detected</div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {biasAlert.map((w, idx) => {
                          const dimensionLabels = {
                            scoring_pattern: 'Scoring Pattern',
                            gender_bias: 'Gender Bias',
                            geographic_bias: 'Geographic Bias',
                            institutional_bias: 'Institutional Bias',
                            tech_stack_bias: 'Tech Stack Bias'
                          };

                          const severityColors = {
                            high: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', label: 'High' },
                            medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', label: 'Medium' },
                            low: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af', label: 'Low' }
                          };
                          
                          const sev = severityColors[w.severity] || severityColors.low;
                          const dimLabel = dimensionLabels[w.type] || w.type;
                          
                          return (
                            <div key={idx} style={{ paddingBottom: idx < biasAlert.length - 1 ? 12 : 0, borderBottom: idx < biasAlert.length - 1 ? '1px solid rgba(251, 191, 36, 0.15)' : 'none' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ 
                                  padding: '1px 6px', 
                                  borderRadius: 4, 
                                  fontSize: 9, 
                                  fontWeight: 700, 
                                  background: sev.bg, 
                                  color: sev.text,
                                  textTransform: 'uppercase'
                                }}>
                                  {sev.label}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', textTransform: 'capitalize' }}>
                                  {dimLabel} Bias
                                </span>
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>{w.message}</div>
                              {w.detail && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{w.detail}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm" 
                      onClick={reviewScores}
                    >
                      Review My Scores
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm" 
                      style={{ background: 'var(--warning)', color: '#000', border: 'none' }} 
                      onClick={submitAnyway}
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Anyway'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-between" style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Total Score</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand-light)', lineHeight: 1 }}>
                    {totalScore}<span style={{ fontSize: 15, fontWeight: 400, color: 'var(--text-muted)' }}> / 50</span>
                  </div>
                </div>
                {!success && (
                  <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || !form.feedback.trim()}>
                    {submitting ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Submitting...</> : <><CheckCircle size={16} /> Submit Evaluation</>}
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card" style={{ position: 'sticky', top: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Project Details</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Title</div>
              <div style={{ fontWeight: 700 }}>{project.title}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Team</div>
              <div>{project.teamName}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Description</div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{project.description}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tech Stack</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {project.techStack?.map((t) => <span key={t} className="badge badge-muted">{t}</span>)}
              </div>
            </div>
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginBottom: 8, width: '100%', justifyContent: 'center' }}>
                <Github size={13} /> View Repository
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                <ExternalLink size={13} /> Live Demo
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
