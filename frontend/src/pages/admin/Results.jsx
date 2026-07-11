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

  const [totalBudget, setTotalBudget] = useState(5000);
  const [prizeAllocations, setPrizeAllocations] = useState([
    { rank: 1, amount: 2500, category: 'Grand Prize Winner', projectId: '' },
    { rank: 2, amount: 1500, category: 'Runner Up', projectId: '' },
    { rank: 3, amount: 750, category: 'Second Runner Up', projectId: '' },
    { rank: 4, amount: 250, category: 'Best UI/UX Design', projectId: '' }
  ]);

  // Load from localStorage per selected hackathon
  useEffect(() => {
    if (!selected) return;
    const savedBudget = localStorage.getItem(`budget_${selected}`);
    const savedAllocations = localStorage.getItem(`allocations_${selected}`);
    if (savedBudget) setTotalBudget(Number(savedBudget));
    else setTotalBudget(5000);
    if (savedAllocations) {
      try {
        setPrizeAllocations(JSON.parse(savedAllocations));
      } catch (e) {
        console.error(e);
      }
    } else {
      setPrizeAllocations([
        { rank: 1, amount: 2500, category: 'Grand Prize Winner', projectId: '' },
        { rank: 2, amount: 1500, category: 'Runner Up', projectId: '' },
        { rank: 3, amount: 750, category: 'Second Runner Up', projectId: '' },
        { rank: 4, amount: 250, category: 'Best UI/UX Design', projectId: '' }
      ]);
    }
  }, [selected]);

  const savePrizeData = (budget, allocations) => {
    localStorage.setItem(`budget_${selected}`, budget);
    localStorage.setItem(`allocations_${selected}`, JSON.stringify(allocations));
  };

  const handleUpdateAmount = (index, amount) => {
    const next = [...prizeAllocations];
    next[index].amount = Number(amount);
    setPrizeAllocations(next);
    savePrizeData(totalBudget, next);
  };

  const handleUpdateProject = (index, projectId) => {
    const next = [...prizeAllocations];
    next[index].projectId = projectId;
    setPrizeAllocations(next);
    savePrizeData(totalBudget, next);
  };

  const handleAddCategory = () => {
    const next = [...prizeAllocations, { rank: prizeAllocations.length + 1, amount: 0, category: 'Custom Category', projectId: '' }];
    setPrizeAllocations(next);
    savePrizeData(totalBudget, next);
  };

  const allocatedBudget = prizeAllocations.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = totalBudget - allocatedBudget;

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

            {/* Budget & Prize Distribution Tracker */}
            <div className="card" style={{ marginBottom: 24, padding: 22, border: '1px solid var(--border)', background: 'var(--bg-surface)', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Sora, sans-serif', color: 'var(--text-primary)', margin: 0 }}>Interactive Budget & Prize Tracker</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Allocate prize pools dynamically to team submissions</p>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Total Budget ($)</label>
                    <input 
                      type="number" 
                      value={totalBudget} 
                      onChange={(e) => { setTotalBudget(Number(e.target.value)); savePrizeData(Number(e.target.value), prizeAllocations); }} 
                      style={{ width: 120, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Allocated</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>${allocatedBudget}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Remaining</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: remainingBudget >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      ${remainingBudget}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
                {prizeAllocations.map((item, idx) => (
                  <div key={idx} style={{ padding: 14, borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{item.category}</span>
                      <input 
                        type="number" 
                        value={item.amount} 
                        onChange={(e) => handleUpdateAmount(idx, e.target.value)}
                        style={{ width: 80, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 11, fontWeight: 700, textAlign: 'right' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Awarded To</label>
                      <select 
                        value={item.projectId} 
                        onChange={(e) => handleUpdateProject(idx, e.target.value)}
                        style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: 11 }}
                      >
                        <option value="">Select project...</option>
                        {results.map((res) => (
                          <option key={res.project._id} value={res.project._id}>
                            #{res.rank} - {res.project.title} ({res.project.teamName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleAddCategory} 
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'flex-start' }}
              >
                + Add Custom Prize Tier
              </button>
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
