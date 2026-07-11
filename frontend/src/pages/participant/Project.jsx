import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { ExternalLink, Video, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Github from '../../components/GithubIcon';
import GithubHealthAnalyzer from '../../components/GithubHealthAnalyzer';
import ProjectQA from '../../components/ProjectQA';

export default function SubmitProject() {
  const { user } = useAuth();
  const [showCertificate, setShowCertificate] = useState(false);
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
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className={`badge badge-${existing.status === 'evaluated' ? 'success' : existing.status === 'submitted' ? 'primary' : 'muted'}`}>
              Status: {existing.status}
            </span>
            {(existing.status === 'submitted' || existing.status === 'evaluated') && (
              <button 
                onClick={() => setShowCertificate(true)} 
                className="btn btn-secondary btn-sm"
                style={{ background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid var(--brand-border)', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}
              >
                🎓 Claim Certificate
              </button>
            )}
          </div>
        )}

        {existing && <GithubHealthAnalyzer projectId={existing._id} />}

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

        {existing && <ProjectQA projectId={existing._id} initialQuestions={existing.questions} />}
      </main>

      {showCertificate && existing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.95)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20
        }} className="no-print">
          <div style={{
            background: '#faf8f5', color: '#1e293b',
            width: '100%', maxWidth: 840,
            padding: 50, borderRadius: 16, border: '12px double #cbd5e1',
            textAlign: 'center', position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            fontFamily: 'serif'
          }} id="certificate-print-area">
            <button 
              onClick={() => setShowCertificate(false)}
              className="no-print"
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(0,0,0,0.05)', border: 'none',
                borderRadius: '50%', width: 32, height: 32,
                cursor: 'pointer', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ✕
            </button>

            <h1 style={{ fontSize: 32, color: 'var(--brand)', marginBottom: 8, fontFamily: 'Sora, sans-serif', fontWeight: 800 }}>HACKFORGE</h1>
            <div style={{ height: 2, background: 'var(--brand)', width: 100, margin: '12px auto 24px auto' }} />
            
            <p style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, color: '#475569' }}>Certificate of Participation</p>
            <p style={{ fontSize: 14, fontStyle: 'italic', margin: '14px 0', color: '#64748b' }}>This is proudly presented to</p>
            
            <h2 style={{ fontSize: 36, fontWeight: 700, margin: '10px 0', fontFamily: 'Sora, sans-serif', color: '#0f172a' }}>{user?.name}</h2>
            
            <div style={{ height: 1, background: '#cbd5e1', width: '60%', margin: '16px auto' }} />
            
            <p style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 580, margin: '20px auto', color: '#334155' }}>
              for successfully submitting the project <strong>{existing.title}</strong> in the hackathon, demonstrating exceptional technical execution, creativity, and collaborative drive.
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 48 }}>
              <div>
                <div style={{ borderBottom: '1px solid #cbd5e1', width: 160, paddingBottom: 6, fontWeight: 'bold', fontSize: 13 }}>HackForge Committee</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Organizing Body</div>
              </div>
              <div>
                <div style={{ borderBottom: '1px solid #cbd5e1', width: 160, paddingBottom: 6, fontWeight: 'bold', fontSize: 13 }}>{new Date(existing.createdAt).toLocaleDateString()}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Date Issued</div>
              </div>
            </div>

            <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 40, fontFamily: 'monospace' }}>
              Verification ID: HACKFORGE-{existing._id.toUpperCase()}
            </p>

            <button 
              onClick={() => window.print()}
              className="btn btn-primary no-print"
              style={{ marginTop: 24, padding: '10px 24px', background: 'var(--brand)', color: '#fff', borderRadius: 8, fontWeight: 600, border: 'none' }}
            >
              🖨 Print / Save as PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
