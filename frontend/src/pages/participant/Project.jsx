import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { ExternalLink, Video, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Github from '../../components/GithubIcon';

export default function SubmitProject() {
  const [form, setForm] = useState({ title: '', description: '', techStack: '', domain: '', githubUrl: '', demoUrl: '', videoUrl: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    api.get('/projects').then((projects) => {
      if (projects.length) { const p = projects[0]; setExisting(p); setForm({ title: p.title, description: p.description, techStack: p.techStack?.join(', ') || '', domain: p.domain || '', githubUrl: p.githubUrl || '', demoUrl: p.demoUrl || '', videoUrl: p.videoUrl || '' }); }
    }).catch(() => {}).finally(() => setFetching(false));
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) { setError('Title and description are required.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const techStack = form.techStack.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await api.post('/projects/submit', { ...form, techStack });
      setExisting(res);
      setSuccess(existing ? 'Project updated successfully.' : 'Project submitted successfully.');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (fetching) return <div className="app-shell"><Sidebar /><main className="main-content"><div className="loading-screen"><div className="spinner" /></div></main></div>;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">{existing ? 'Update Submission' : 'Submit Project'}</h1>
          <p className="page-subtitle">
            {existing ? 'Your submission can be updated until the deadline.' : 'Submit your team\'s project for evaluation.'}
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><AlertCircle size={15} />{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}><CheckCircle size={15} />{success}</div>}

        {existing && (
          <div style={{ marginBottom: 16 }}>
            <span className={`badge badge-${existing.status === 'evaluated' ? 'success' : existing.status === 'submitted' ? 'primary' : 'muted'}`}>
              Status: {existing.status}
            </span>
          </div>
        )}

        <div className="card" style={{ maxWidth: 720 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Project Title</label>
              <input id="project-title" className="form-input" value={form.title} onChange={set('title')} placeholder="e.g. EduBot — AI-powered learning assistant" maxLength={120} />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea id="project-desc" className="form-textarea" value={form.description} onChange={set('description')} placeholder="Describe your project, the problem it solves, key features, how it works, and the impact..." rows={6} />
              <p className="form-hint">{form.description.length}/3000 characters</p>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Tech Stack</label>
                <input className="form-input" value={form.techStack} onChange={set('techStack')} placeholder="React, Node.js, MongoDB, Python" />
                <p className="form-hint">Comma-separated</p>
              </div>
              <div className="form-group">
                <label className="form-label">Domain</label>
                <select className="form-select" value={form.domain} onChange={set('domain')}>
                  <option value="">Select domain...</option>
                  {['AI/ML', 'Web', 'Mobile', 'Blockchain', 'IoT', 'FinTech', 'EdTech', 'HealthTech', 'SustainTech', 'AR/VR', 'Security', 'Open Source', 'Other'].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Github size={14} />GitHub Repository</span>
              </label>
              <input className="form-input" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/team/project" type="url" />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ExternalLink size={14} />Live Demo URL (optional)</span>
                </label>
                <input className="form-input" value={form.demoUrl} onChange={set('demoUrl')} placeholder="https://demo.example.com" type="url" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Video size={14} />Video URL (optional)</span>
                </label>
                <input className="form-input" value={form.videoUrl} onChange={set('videoUrl')} placeholder="YouTube or Drive link" type="url" />
              </div>
            </div>

            <button id="submit-project" type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={15} />}
              {existing ? 'Update Submission' : 'Submit Project'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
