import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { Star, Send, CheckCircle, AlertCircle } from 'lucide-react';

const TYPES = [
  { value: 'platform', label: 'Platform Experience' },
  { value: 'evaluation', label: 'Evaluation Process' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'general', label: 'General' },
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <Star
            size={28}
            fill={(hover || value) >= n ? 'var(--warning)' : 'none'}
            stroke={(hover || value) >= n ? 'var(--warning)' : 'var(--text-muted)'}
          />
        </button>
      ))}
      {value > 0 && <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center', marginLeft: 4 }}>{['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][value]}</span>}
    </div>
  );
}

export default function ParticipantFeedback() {
  const [hackathons, setHackathons] = useState([]);
  const [form, setForm] = useState({ hackathonId: '', type: 'platform', content: '', rating: 0, isAnonymous: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { api.get('/hackathons').then(setHackathons).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hackathonId || !form.content || !form.rating) { setError('All fields including rating are required.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/feedback', form);
      setSuccess('Feedback submitted. Thank you!');
      setForm((p) => ({ ...p, content: '', rating: 0 }));
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Submit Feedback</h1>
          <p className="page-subtitle">Your feedback helps improve the hackathon experience</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><AlertCircle size={15} />{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}><CheckCircle size={15} />{success}</div>}

        <div className="card" style={{ maxWidth: 560 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Hackathon</label>
              <select className="form-select" value={form.hackathonId} onChange={(e) => setForm((p) => ({ ...p, hackathonId: e.target.value }))}>
                <option value="">Select hackathon...</option>
                {hackathons.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Feedback Category</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`skill-pill ${form.type === t.value ? 'selected' : ''}`}
                    onClick={() => setForm((p) => ({ ...p, type: t.value }))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Rating</label>
              <StarRating value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Your Feedback</label>
              <textarea className="form-textarea" value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="Share your honest experience..." rows={5} maxLength={2000} />
              <p className="form-hint">{form.content.length}/2000</p>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="anon" checked={form.isAnonymous} onChange={(e) => setForm((p) => ({ ...p, isAnonymous: e.target.checked }))} style={{ accentColor: 'var(--brand)', width: 16, height: 16 }} />
              <label htmlFor="anon" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Submit anonymously</label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={15} />}
              Submit Feedback
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
