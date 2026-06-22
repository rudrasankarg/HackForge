import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import Sidebar from '../../components/Sidebar';
import { toast } from '../../utils/toast';
import { fmt } from '../../utils/formatters';
import { Plus, CalendarDays, Users, Clock } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  name: '', description: '', theme: '', maxTeamSize: 4, minTeamSize: 1,
  registrationDeadline: '', submissionDeadline: '', status: 'upcoming', maxParticipants: 200,
  prizes: '', rules: '', createdBy: '',
};

export default function AdminHackathons() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, createdBy: user?._id || '' });
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [organizers, setOrganizers] = useState([]);

  const getMinDateTimeString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  const minDateTime = getMinDateTimeString();


  useEffect(() => {
    api.get('/hackathons').then(setHackathons).catch(() => {}).finally(() => setLoading(false));
    if (user?.role === 'admin') {
      api.get('/organizers')
        .then(res => setOrganizers(Array.isArray(res) ? res.filter(o => o.verificationStatus === 'approved') : []))
        .catch(() => {});
    }
  }, [user]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dataToSave = { ...form };
      if (!dataToSave.createdBy) {
        dataToSave.createdBy = user?._id;
      }
      if (editing) {
        const res = await api.put(`/hackathons/${editing}`, dataToSave);
        setHackathons((prev) => prev.map((h) => h._id === editing ? res : h));
        toast.success('Hackathon updated');
      } else {
        const res = await api.post('/hackathons', dataToSave);
        setHackathons((prev) => [res, ...prev]);
        toast.success('Hackathon created');
      }
      setForm({ ...EMPTY_FORM, createdBy: user?._id || '' });
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save hackathon');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (h) => {
    setForm({
      name: h.name, description: h.description || '', theme: h.theme || '',
      maxTeamSize: h.maxTeamSize || 4, minTeamSize: h.minTeamSize || 1,
      registrationDeadline: h.registrationDeadline ? h.registrationDeadline.slice(0, 16) : '',
      submissionDeadline: h.submissionDeadline ? h.submissionDeadline.slice(0, 16) : '',
      status: h.status || 'upcoming', maxParticipants: h.maxParticipants || 200,
      prizes: h.prizes || '', rules: h.rules || '',
      createdBy: h.createdBy?._id || h.createdBy || '',
    });
    setEditing(h._id);
    setShowForm(true);
  };

  const statusBadge = { upcoming: 'badge-info', active: 'badge-success', closed: 'badge-muted', cancelled: 'badge-danger' };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header flex-between">
          <div>
            <h1 className="page-title">Hackathons</h1>
            <p className="page-subtitle">Create and manage your hackathon events</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY_FORM); }}>
            <Plus size={15} /> {showForm ? 'Close Form' : 'Create Hackathon'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>{editing ? 'Edit Hackathon' : 'New Hackathon'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Hackathon Name</label>
                  <input className="form-input" value={form.name} onChange={set('name')} required placeholder="e.g. InnoVate 2025" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={set('description')} rows={3} placeholder="What is this hackathon about?" />
                </div>
                <div className="form-group">
                  <label className="form-label">Theme / Track</label>
                  <input className="form-input" value={form.theme} onChange={set('theme')} placeholder="e.g. AI for Social Good" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={set('status')}>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Deadline</label>
                  <input className="form-input" type="datetime-local" value={form.registrationDeadline} onChange={set('registrationDeadline')} min={minDateTime} />
                </div>
                <div className="form-group">
                  <label className="form-label">Submission Deadline</label>
                  <input className="form-input" type="datetime-local" value={form.submissionDeadline} onChange={set('submissionDeadline')} min={minDateTime} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Team Size</label>
                  <input className="form-input" type="number" min={1} max={10} value={form.minTeamSize} onChange={set('minTeamSize')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Team Size</label>
                  <input className="form-input" type="number" min={1} max={10} value={form.maxTeamSize} onChange={set('maxTeamSize')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Participants</label>
                  <input className="form-input" type="number" min={1} value={form.maxParticipants} onChange={set('maxParticipants')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Prizes</label>
                  <input className="form-input" value={form.prizes} onChange={set('prizes')} placeholder="e.g. 1st: $5000, 2nd: $2000" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Rules & Guidelines</label>
                  <textarea className="form-textarea" value={form.rules} onChange={set('rules')} rows={3} placeholder="Participation rules, eligibility criteria..." />
                </div>
                {user?.role === 'admin' && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Assign Organizer</label>
                    <select className="form-select" value={form.createdBy} onChange={set('createdBy')}>
                      <option value={user._id}>Myself (Admin)</option>
                      {organizers.map(org => (
                        <option key={org._id} value={org._id}>{org.companyName || org.name} ({org.email})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Saving...</> : editing ? 'Update Hackathon' : 'Create Hackathon'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: 'auto' }} /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {hackathons.map((h) => (
              <div key={h._id} className="card">
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--brand-dim)', border: '1px solid var(--brand-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: 'var(--brand-light)' }}>
                      {h.name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{h.name}</div>
                      {h.theme && <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{h.theme}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge ${statusBadge[h.status] || 'badge-muted'}`} style={{ textTransform: 'capitalize' }}>{h.status}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(h)}>Edit</button>
                  </div>
                </div>
                {h.description && <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>{h.description}</p>}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
                    <CalendarDays size={13} />
                    Reg. by {h.registrationDeadline ? fmt.datetime(h.registrationDeadline) : 'No deadline'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
                    <Clock size={13} />
                    Submit by {h.submissionDeadline ? fmt.datetime(h.submissionDeadline) : 'No deadline'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-muted)' }}>
                    <Users size={13} />
                    Teams of {h.minTeamSize}–{h.maxTeamSize} | Max {h.maxParticipants} participants
                  </div>
                </div>
                {h.prizes && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    Prizes: {h.prizes}
                  </div>
                )}
              </div>
            ))}
            {!hackathons.length && (
              <div className="empty-state card">
                <CalendarDays size={28} />
                <h3>No hackathons yet</h3>
                <p>Create your first hackathon event to get started</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
