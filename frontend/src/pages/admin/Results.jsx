import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import { Trophy, Send, Eye } from 'lucide-react';

export default function AdminResults() {
  const [hackathons, setHackathons] = useState([]);
  const [selected, setSelected] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [finalising, setFinalising] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    api.get('/hackathons').then((h) => { setHackathons(h); if (h.length) setSelected(h[0]._id); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get(`/results/${selected}`).then((res) => {
      setResults(res.results || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selected]);

  const handleFinalise = async () => {
    setFinalising(true);
    try {
      const res = await api.post(`/results/${selected}/finalise`);
      setResults(res.results || []);
      toast.success('Results finalised and AI feedback generated');
    } catch (err) {
      toast.error(err.message || 'Failed to finalise results');
    } finally {
      setFinalising(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await api.post('/projects/publish', { hackathonId: selected });
      setPublished(true);
      toast.success('Results published — participants can now view their rankings');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const rankBadgeClass = (rank) => rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Results</h1>
            <p className="page-subtitle">Score normalisation, tie-breaking, and AI-generated feedback</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="form-select" style={{ width: 220 }} value={selected} onChange={(e) => setSelected(e.target.value)}>
              {hackathons.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={handleFinalise} disabled={finalising || !selected}>
              {finalising ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Generating...</> : 'Finalise & Generate Feedback'}
            </button>
            <button className="btn btn-primary" onClick={handlePublish} disabled={publishing || !results.length}>
              <Send size={14} /> {published ? 'Published' : 'Publish to Participants'}
            </button>
          </div>
        </div>

        {finalising && (
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <div className="spinner" style={{ width: 14, height: 14 }} />
            AI is normalising scores across reviewers, detecting outliers, and generating personalised feedback...
          </div>
        )}

        {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div> : results.length === 0 ? (
          <div className="empty-state card">
            <Trophy size={32} />
            <h3>No results yet</h3>
            <p>Finalise results once reviewers have completed their evaluations</p>
          </div>
        ) : (
          <>
            <div className="grid-3" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-value">{results.length}</div>
                <div className="stat-label">Projects Ranked</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--success)' }}>
                  {results.length ? fmt.score(results.reduce((s, r) => s + r.finalScore, 0) / results.length) : '—'}
                </div>
                <div className="stat-label">Average Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: 'var(--accent)' }}>
                  {results.reduce((s, r) => s + r.evaluationCount, 0)}
                </div>
                <div className="stat-label">Total Evaluations</div>
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Project</th>
                      <th>Team</th>
                      <th>Score</th>
                      <th>Confidence</th>
                      <th>Evaluations</th>
                      <th>AI Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.project._id} style={{ background: r.rank <= 3 ? 'rgba(124,58,237,0.04)' : undefined }}>
                        <td>
                          <span className={`rank-badge ${rankBadgeClass(r.rank)}`}>
                            {r.rank}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{r.project.title}</div>
                            {(r.confidenceScore !== undefined && r.confidenceScore !== null) ? (
                              <span className={`badge ${r.confidenceScore >= 85 ? 'badge-success' : r.confidenceScore >= 65 ? 'badge-warning' : 'badge-muted'}`} style={{ fontSize: 10 }}>
                                Confidence: {Math.round(r.confidenceScore)}%
                              </span>
                            ) : (r.project?.confidenceScore !== undefined && r.project?.confidenceScore !== null) ? (
                              <span className={`badge ${r.project.confidenceScore >= 85 ? 'badge-success' : r.project.confidenceScore >= 65 ? 'badge-warning' : 'badge-muted'}`} style={{ fontSize: 10 }}>
                                Confidence: {Math.round(r.project.confidenceScore)}%
                              </span>
                            ) : null}
                          </div>
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                            {(r.project.techStack || []).slice(0, 2).map((t) => <span key={t} className="badge badge-muted" style={{ fontSize: 10 }}>{t}</span>)}
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.project.teamName}</td>
                        <td>
                          <div className="score-ring">{fmt.score(r.finalScore)}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            ±{fmt.score(r.confidenceInterval)}
                          </div>
                          <div className="progress" style={{ width: 60, marginTop: 4 }}>
                            <div className="progress-bar" style={{ width: `${100 - (r.confidenceInterval / r.finalScore) * 100}%` }} />
                          </div>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: 14 }}>{r.evaluationCount}</td>
                        <td style={{ maxWidth: 260 }}>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {r.feedback || r.project.aiFeedback || 'Feedback will appear after finalisation'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
