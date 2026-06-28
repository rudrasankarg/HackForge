import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import { Megaphone, Trash2, Pin } from 'lucide-react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', targetRole: 'all', type: 'info', pinned: false });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/announcements').then(setAnnouncements).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/announcements', form);
      setAnnouncements((prev) => [res, ...prev]);
      setForm({ title: '', body: '', targetRole: 'all', type: 'info', pinned: false });
      toast.success('Announcement published');
    } catch (err) {
      toast.error(err.message || 'Failed to publish');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
      toast.info('Announcement deleted');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const typeBadge = { info: 'badge-info', success: 'badge-success', warning: 'badge-warning', urgent: 'badge-danger' };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Broadcast updates to participants and reviewers in real time</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24 }}>
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Megaphone size={16} style={{ color: 'var(--brand-light)' }} />
                <h3 style={{ fontWeight: 700, fontSize: 15 }}>New Announcement</h3>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={form.title} onChange={set('title')} required placeholder="e.g. Evaluation Phase Has Started" />
                </div>
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea className="form-textarea" value={form.body} onChange={set('body')} required placeholder="Write your announcement..." rows={4} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Audience</label>
                    <select className="form-select" value={form.targetRole} onChange={set('targetRole')}>
                      <option value="all">Everyone</option>
                      <option value="participant">Participants Only</option>
                      <option value="reviewer">Reviewers Only</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={set('type')}>
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <input type="checkbox" id="pinned-chk" checked={form.pinned} onChange={set('pinned')} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                  <label htmlFor="pinned-chk" style={{ fontSize: 13.5, color: 'var(--text-secondary)', cursor: 'pointer' }}>Pin to top of feed</label>
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                  {submitting ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Publishing...</> : 'Publish Announcement'}
                </button>
              </form>
            </div>
          </div>

          <div>
            <h3 style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>Published Announcements</h3>
            {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: 'auto' }} /></div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {announcements.map((a) => (
                  <div key={a._id} className="card" style={{ padding: '18px 20px', borderLeft: a.type === 'urgent' ? '3px solid var(--danger)' : a.type === 'warning' ? '3px solid var(--warning)' : a.type === 'success' ? '3px solid var(--success)' : '3px solid var(--brand)' }}>
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {a.pinned && <Pin size={13} style={{ color: 'var(--warning)' }} />}
                        <span className={`badge ${typeBadge[a.type] || 'badge-muted'}`} style={{ fontSize: 10, textTransform: 'capitalize' }}>{a.type}</span>
                        <span className="badge badge-muted" style={{ fontSize: 10, textTransform: 'capitalize' }}>{a.targetRole === 'all' ? 'Everyone' : a.targetRole}</span>
                      </div>
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => handleDelete(a._id)}
                        disabled={deleting === a._id}
                        style={{ padding: '4px 6px' }}
                      >
                        {deleting === a._id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Trash2 size={13} />}
                      </button>
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{a.title}</h4>
                    <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{a.body}</p>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                      Published by {a.createdBy?.name || 'Admin'} — {fmt.datetime(a.createdAt)}
                    </div>
                  </div>
                ))}
                {!announcements.length && (
                  <div className="empty-state card">
                    <Megaphone size={28} />
                    <h3>No announcements</h3>
                    <p>Publish your first announcement to participants</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
