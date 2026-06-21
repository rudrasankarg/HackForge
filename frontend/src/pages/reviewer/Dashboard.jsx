import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { Link } from 'react-router-dom';
import { ClipboardList, ExternalLink, CheckCircle, Clock } from 'lucide-react';

export default function ReviewerDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/evaluations/assigned').then((res) => {
      setAssignments(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const done = assignments.filter((a) => a.evaluated).length;
  const pending = assignments.filter((a) => !a.evaluated).length;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">My Assignments</h1>
          <p className="page-subtitle">Projects assigned to you — you can only access listed projects</p>
        </div>

        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-value">{assignments.length}</div>
            <div className="stat-label">Total Assigned</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--warning)' }}>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'var(--success)' }}>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{done}</div>
            <div className="stat-label">Evaluated</div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : assignments.length === 0 ? (
          <div className="empty-state card">
            <ClipboardList size={36} />
            <h3>No assignments yet</h3>
            <p>The organizer will assign projects to you when the evaluation phase begins.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assignments.map((a) => (
              <div key={a.assignment._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{a.project?.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge badge-muted">{a.project?.teamName}</span>
                    {a.project?.domain && <span className="badge badge-primary">{a.project.domain}</span>}
                    {a.project?.techStack?.slice(0, 3).map((t) => <span key={t} className="badge badge-muted">{t}</span>)}
                    <span className="badge badge-accent">{((a.assignment.confidence || 0) * 100).toFixed(0)}% match</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {a.evaluated ? (
                    <>
                      <span className="badge badge-success"><CheckCircle size={11} /> Submitted</span>
                      {a.evaluation?.totalScore !== undefined && (
                        <div className="score-ring">{a.evaluation.totalScore}</div>
                      )}
                    </>
                  ) : (
                    <Link to={`/reviewers/evaluate/${a.project?._id}`} className="btn btn-primary btn-sm">
                      <ExternalLink size={13} /> Evaluate
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
