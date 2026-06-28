import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';
import { FileText, ShieldAlert, ShieldCheck, Filter, Users, FolderOpen } from 'lucide-react';

export default function AuditTrail() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewerOptions, setReviewerOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  
  const [filters, setFilters] = useState({
    reviewerId: '',
    projectId: '',
    hasBias: ''
  });

  // Fetch unique filter options based on all completed evaluations initially
  useEffect(() => {
    api.get('/admin/audit-trail')
      .then((data) => {
        const reviewers = [];
        const seenReviewers = new Set();
        const projects = [];
        const seenProjects = new Set();

        data.forEach((entry) => {
          if (entry.reviewerId && !seenReviewers.has(entry.reviewerId)) {
            seenReviewers.add(entry.reviewerId);
            reviewers.push({ id: entry.reviewerId, name: entry.reviewerName });
          }
          if (entry.projectId && !seenProjects.has(entry.projectId)) {
            seenProjects.add(entry.projectId);
            projects.push({ id: entry.projectId, title: entry.projectName });
          }
        });

        // Sort options alphabetically
        reviewers.sort((a, b) => a.name.localeCompare(b.name));
        projects.sort((a, b) => a.title.localeCompare(b.title));

        setReviewerOptions(reviewers);
        setProjectOptions(projects);
      })
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  // Fetch audit trail entries on filter change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.reviewerId) params.set('reviewerId', filters.reviewerId);
    if (filters.projectId) params.set('projectId', filters.projectId);
    if (filters.hasBias !== '') params.set('hasBias', filters.hasBias);

    api.get(`/admin/audit-trail?${params}`)
      .then((data) => {
        setEntries(data || []);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to fetch audit trail');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleBias = () => {
    setFilters((prev) => ({
      ...prev,
      hasBias: prev.hasBias === 'true' ? '' : 'true'
    }));
  };

  const renderScores = (scores) => {
    if (!scores) return '—';
    return (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 300 }}>
        {Object.entries(scores).map(([key, score]) => {
          let label = key;
          if (key === 'uiux') label = 'UI/UX';
          else label = key.charAt(0).toUpperCase() + key.slice(1);
          return (
            <span key={key} className="badge badge-muted" style={{ fontSize: 10, padding: '2px 6px' }}>
              {label}: {score}/10
            </span>
          );
        })}
      </div>
    );
  };

  const renderBiasBadge = (entry) => {
    if (!entry.hasBiasFlag) return null;
    const isActive = entry.biasStatus === 'active';
    
    return (
      <span 
        className={`badge ${isActive ? 'badge-danger' : 'badge-success'}`}
        style={{ 
          fontSize: 10, 
          padding: '2px 8px', 
          fontWeight: 600,
          textTransform: 'capitalize'
        }}
      >
        {isActive ? <ShieldAlert size={10} style={{ marginRight: 3 }} /> : <ShieldCheck size={10} style={{ marginRight: 3 }} />}
        {entry.biasType ? `${entry.biasType.replace('-', ' ')} (${entry.biasStatus})` : entry.biasStatus}
      </span>
    );
  };

  const activeBiasCount = entries.filter(e => e.hasBiasFlag && e.biasStatus === 'active').length;

  return (
    <div className="app-shell">
      <Sidebar biasAlertCount={activeBiasCount} />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Evaluation Audit Trail</h1>
            <p className="page-subtitle">Chronological, immutable trail of all completed project evaluations</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card card-sm" style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)', marginRight: 4 }}>
            <Filter size={14} /> Filters:
          </div>

          <select 
            className="form-select" 
            style={{ width: 200 }} 
            value={filters.reviewerId} 
            onChange={(e) => handleFilterChange('reviewerId', e.target.value)}
          >
            <option value="">All Reviewers</option>
            {reviewerOptions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          <select 
            className="form-select" 
            style={{ width: 220 }} 
            value={filters.projectId} 
            onChange={(e) => handleFilterChange('projectId', e.target.value)}
          >
            <option value="">All Projects</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>

          <button 
            type="button"
            className={`btn btn-sm ${filters.hasBias === 'true' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleToggleBias}
            style={{ gap: 6 }}
          >
            <ShieldAlert size={14} />
            Show Bias-Flagged Only
          </button>

          {Object.values(filters).some(Boolean) && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              style={{ marginLeft: 'auto' }}
              onClick={() => setFilters({ reviewerId: '', projectId: '', hasBias: '' })}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Main Audit Trail Listing */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} type="list" height={80} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState 
            title="No Audit Entries Found"
            subtitle={Object.values(filters).some(Boolean) 
              ? "No evaluations match your current filter selections. Try adjusting or clearing your filters."
              : "No evaluations have been submitted yet. Once reviewers complete evaluations, they will be logged here."
            }
            icon="FileText"
          />
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Project</th>
                    <th>Team</th>
                    <th>Reviewer</th>
                    <th>Total Score</th>
                    <th>Criterion Scores</th>
                    <th>Bias Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isFlaggedActive = entry.hasBiasFlag && entry.biasStatus === 'active';
                    return (
                      <tr 
                        key={entry._id} 
                        style={{ 
                          background: isFlaggedActive ? 'rgba(239, 68, 68, 0.02)' : undefined 
                        }}
                      >
                        <td 
                          style={{ 
                            fontSize: 11.5, 
                            color: 'var(--text-muted)', 
                            whiteSpace: 'nowrap',
                            borderLeft: isFlaggedActive ? '4px solid var(--danger)' : '4px solid transparent',
                            paddingLeft: isFlaggedActive ? 10 : 14
                          }}
                        >
                          {fmt.datetime(entry.submittedAt)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>
                            {entry.projectName}
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>{entry.teamName}</td>
                        <td style={{ fontWeight: 500, fontSize: 13 }}>{entry.reviewerName}</td>
                        <td>
                          <span className="score-ring" style={{ width: 34, height: 34, fontSize: 12 }}>
                            {entry.totalScore}
                          </span>
                        </td>
                        <td>{renderScores(entry.scores)}</td>
                        <td>{renderBiasBadge(entry)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
