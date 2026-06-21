import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import { ShieldCheck, ShieldAlert, Shield, Search, Loader2, Sparkles } from 'lucide-react';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

export default function CheatShield() {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState('');
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [runningPlag, setRunningPlag] = useState(null);

  const fetchHackathons = async () => {
    try {
      const res = await api.get('/hackathons');
      setHackathons(res || []);
      if (res?.length > 0) {
        setSelectedHackathon(res[0]._id);
      }
    } catch {
      toast.error('Failed to load hackathons.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogsAndProjects = async (hackathonId) => {
    if (!hackathonId) return;
    setLoading(true);
    try {
      const projList = await api.get(`/projects?hackathonId=${hackathonId}`);
      setProjects(projList || []);

      const logList = await api.get(`/ai-evaluation/hackathon/${hackathonId}/cheat-shield`);
      setLogs(logList || []);
    } catch (err) {
      toast.error('Failed to fetch projects or audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  useEffect(() => {
    if (selectedHackathon) {
      fetchLogsAndProjects(selectedHackathon);
    }
  }, [selectedHackathon]);

  const handleRunPlagiarismCheck = async (projectId) => {
    setRunningPlag(projectId);
    try {
      const res = await api.post('/ai-evaluation/project/cheat-check', { projectId });
      setLogs(prev => {
        const idx = prev.findIndex(l => l.projectId?._id === projectId || l.projectId === projectId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = res;
          return updated;
        }
        return [...prev, res];
      });
      toast.success('Cheat Shield audit complete!');
    } catch (err) {
      toast.error(err.message || 'Audit scan failed.');
    } finally {
      setRunningPlag(null);
    }
  };

  const getRiskBadge = (level) => {
    if (level === 'high') return <span className="badge badge-danger">High Risk</span>;
    if (level === 'medium') return <span className="badge badge-warning">Medium Risk</span>;
    return <span className="badge badge-success">Clear</span>;
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck style={{ color: 'var(--brand)' }} /> AI Cheat Shield
            </h1>
            <p className="page-subtitle">Plagiarism scanning, tutorial matching, and starter template detection on project code/descriptions.</p>
          </div>
          <div>
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

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} type="list" height={100} />)}
          </div>
        ) : !selectedHackathon ? (
          <EmptyState
            title="Select Hackathon"
            subtitle="Please select a hackathon from the dropdown to check cheat compliance logs."
            icon="Shield"
          />
        ) : projects.length === 0 ? (
          <EmptyState
            title="No Submissions Yet"
            subtitle="No projects have been submitted for this hackathon."
            icon="Shield"
          />
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>GitHub Repository</th>
                    <th>Plagiarism Risk</th>
                    <th>Template Match</th>
                    <th>Shield Status</th>
                    <th>Scan Logs</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => {
                    const log = logs.find(l => l.projectId?._id === p._id || l.projectId === p._id);
                    const isRunning = runningPlag === p._id;

                    return (
                      <tr key={p._id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Team: {p.teamName}</div>
                        </td>
                        <td>
                          {p.githubUrl ? (
                            <a href={p.githubUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--brand-light)', textDecoration: 'none', fontWeight: 600 }}>
                              {p.githubUrl.replace('https://github.com/', '')}
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No repository link</span>
                          )}
                        </td>
                        <td>
                          {log ? (
                            <span style={{ fontWeight: 700, color: log.plagiarismScore > 50 ? 'var(--danger)' : 'var(--text-primary)' }}>
                              {log.plagiarismScore}%
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {log ? (
                            <span style={{ fontWeight: 700, color: log.boilerplateMatchScore > 60 ? 'var(--warning)' : 'var(--text-primary)' }}>
                              {log.boilerplateMatchScore}%
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          {log ? getRiskBadge(log.riskLevel) : <span className="badge badge-muted">Not Audited</span>}
                        </td>
                        <td style={{ fontSize: 12, maxWidth: 300 }}>
                          {log ? (
                            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{log.matchDetails}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending scanning</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={isRunning}
                            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => handleRunPlagiarismCheck(p._id)}
                          >
                            {isRunning ? (
                              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Sparkles size={12} />
                            )}
                            Scan Repo
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
