import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { Scale, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import { toast } from '../../utils/toast';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

const STATUS_MAP = {
  pending: { label: 'Pending', cls: 'badge-warning' },
  under_review: { label: 'Under Review', cls: 'badge-info' },
  accepted: { label: 'Accepted', cls: 'badge-success' },
  dismissed: { label: 'Dismissed', cls: 'badge-danger' },
};

export default function ParticipantAppeal() {
  const [appeals, setAppeals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ projectId: '', hackathonId: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/appeals/mine'),
      api.get('/projects'),
      api.get('/hackathons'),
    ]).then(([a, p, h]) => { setAppeals(a); setProjects(p); setHackathons(h); }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId || !form.reason) { setError('Project and reason are required.'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await api.post('/appeals', form);
      setAppeals((prev) => [res, ...prev]);
      setSuccess('Appeal submitted successfully.');
      toast.success('Appeal submitted successfully.');
      setForm({ projectId: '', hackathonId: '', reason: '' });
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">File an Appeal</h1>
          <p className="page-subtitle">If you believe your project was unfairly evaluated, you can file an appeal for admin review</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><AlertCircle size={15} />{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}><CheckCircle size={15} />{success}</div>}

        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>New Appeal</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Project</label>
                <select className="form-select" value={form.projectId} onChange={(e) => setForm((p) => ({ ...p, projectId: e.target.value }))}>
                  <option value="">Select your project...</option>
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Appeal</label>
                <textarea className="form-textarea" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Explain your concern clearly. Mention specific aspects of the evaluation you disagree with and provide context..." rows={6} maxLength={2000} />
                <p className="form-hint">{form.reason.length}/2000</p>
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Scale size={15} />}
                Submit Appeal
              </button>
            </form>
          </div>

          <div>
            <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Your Appeals</h3>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2].map((i) => (
                  <SkeletonCard key={i} type="list" height={70} />
                ))}
              </div>
            ) : appeals.length === 0 ? (
              <EmptyState
                title="No Appeals Yet"
                subtitle="Appeals you submit will appear here. If you believe your project was unfairly evaluated, you can file an appeal."
                icon="Scale"
              />
            ) : (
              appeals.map((a) => (
                <div key={a._id} className="card card-sm" style={{ marginBottom: 10 }}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{a.projectId?.title}</span>
                    <span className={`badge ${STATUS_MAP[a.status]?.cls || 'badge-muted'}`}>{STATUS_MAP[a.status]?.label}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: a.adminNote ? 8 : 0 }}>{a.reason.slice(0, 150)}{a.reason.length > 150 ? '...' : ''}</p>
                  {a.adminNote && (
                    <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-overlay)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <strong>Admin response:</strong> {a.adminNote}
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
