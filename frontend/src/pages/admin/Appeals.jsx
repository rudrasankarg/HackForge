import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { Scale, CheckCircle, X, RefreshCw } from 'lucide-react';
import { toast } from '../../utils/toast';

const STATUS_MAP = {
  pending: { label: 'Pending', cls: 'badge-warning' },
  under_review: { label: 'Under Review', cls: 'badge-info' },
  accepted: { label: 'Accepted', cls: 'badge-success' },
  dismissed: { label: 'Dismissed', cls: 'badge-danger' },
};

export default function AdminAppeals() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [reviewing, setReviewing] = useState(null);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = (status) => {
    setLoading(true);
    api.get(`/appeals${status ? `?status=${status}` : ''}`).then(setAppeals).finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const review = async (id, status) => {
    setProcessing(true);
    try {
      const res = await api.patch(`/appeals/${id}/review`, { status, adminNote: note });
      setAppeals((prev) => prev.map((a) => a._id === res._id ? res : a));
      setReviewing(null); setNote('');
    } catch (err) { toast.error(err.message); } finally { setProcessing(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Appeals</h1>
          <p className="page-subtitle">Review participant evaluation appeals</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['pending', 'under_review', 'accepted', 'dismissed', ''].map((s) => (
            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>
              {s ? STATUS_MAP[s]?.label : 'All'}
            </button>
          ))}
        </div>

        {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {appeals.map((a) => (
              <div key={a._id} className="card">
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.participantId?.name} — {a.projectId?.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.participantId?.email} &bull; {a.participantId?.institution}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge ${STATUS_MAP[a.status]?.cls || 'badge-muted'}`}>{STATUS_MAP[a.status]?.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                  {a.reason}
                </div>

                {a.adminNote && (
                  <div style={{ padding: '10px 14px', background: 'var(--info-dim)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 13, marginBottom: 12 }}>
                    <strong style={{ color: 'var(--info)' }}>Admin note:</strong> {a.adminNote}
                  </div>
                )}

                {(a.status === 'pending' || a.status === 'under_review') && (
                  reviewing === a._id ? (
                    <div>
                      <textarea className="form-textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note to the participant (optional)..." rows={2} style={{ marginBottom: 10 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success btn-sm" disabled={processing} onClick={() => review(a._id, 'accepted')}>
                          <CheckCircle size={13} /> Accept Appeal
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={processing} onClick={() => review(a._id, 'dismissed')}>
                          <X size={13} /> Dismiss
                        </button>
                        <button className="btn btn-secondary btn-sm" disabled={processing} onClick={() => review(a._id, 'under_review')}>
                          <RefreshCw size={13} /> Mark Under Review
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setReviewing(null); setNote(''); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => setReviewing(a._id)}>
                      <Scale size={13} /> Review Appeal
                    </button>
                  )
                )}
              </div>
            ))}
            {appeals.length === 0 && <div className="empty-state"><Scale size={32} /><h3>No appeals found</h3><p>Appeals matching this filter will appear here</p></div>}
          </div>
        )}
      </main>
    </div>
  );
}
