import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../utils/toast';
import { Users, Plus, Trash2, Send, Filter, CheckCircle2 } from 'lucide-react';

const C = {
  bg:      'var(--bg-base)',
  surface: 'var(--bg-surface)',
  border:  'var(--border)',
  text:    'var(--text-primary)',
  sub:     'var(--text-secondary)',
  muted:   'var(--text-muted)',
  brand:   'var(--brand)',
  accent:  'var(--accent)',
};

export default function Matchmaking() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, participant, team
  
  // New post form state
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('participant');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [skills, setSkills] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/matchmaking');
      setPosts(data);
    } catch (err) {
      toast.error('Failed to load matchmaking posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error('Please enter a message');

    setSubmitting(true);
    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const newPost = await api.post('/matchmaking', {
        type,
        title: title || (type === 'team' ? 'Looking for Teammates' : 'Looking for a Team'),
        message,
        skills: skillsArray
      });

      setPosts([newPost, ...posts]);
      toast.success('Matchmaking post published!');
      setShowForm(false);
      setTitle('');
      setMessage('');
      setSkills('');
    } catch (err) {
      toast.error(err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/matchmaking/${id}`);
      setPosts(posts.filter(p => p._id !== id));
      toast.success('Post deleted successfully');
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const filteredPosts = posts.filter(p => filter === 'all' || p.type === filter);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 className="page-title">Matchmaking Board</h1>
            <p className="page-subtitle">Find teammates or join an active team</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '10px 18px', 
              background: 'var(--brand)', 
              color: '#fff', 
              borderRadius: 10,
              fontWeight: 600,
              border: 'none'
            }}
          >
            <Plus size={16} /> {showForm ? 'Cancel Post' : 'Post Requirement'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card" style={{ padding: 24, marginBottom: 24, border: `1px solid ${C.border}`, borderRadius: 14, background: C.surface }}>
            <h3 style={{ marginBottom: 16, fontFamily: 'Sora, sans-serif' }}>Create Matchmaking Post</h3>
            
            <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <input 
                  type="radio" 
                  name="type" 
                  value="participant" 
                  checked={type === 'participant'} 
                  onChange={() => setType('participant')} 
                />
                I am looking for a Team
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <input 
                  type="radio" 
                  name="type" 
                  value="team" 
                  checked={type === 'team'} 
                  onChange={() => setType('team')} 
                />
                Our Team is looking for Members
              </label>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Post Title</label>
              <input 
                type="text" 
                placeholder="e.g. Backend Dev needed or React Developer looking to join" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description / Details</label>
              <textarea 
                placeholder="Describe your project idea or your skills and experience..." 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Required Skills (comma separated)</label>
              <input 
                type="text" 
                placeholder="e.g. React, Node.js, Python, Figma" 
                value={skills} 
                onChange={(e) => setSkills(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text }}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 8 }}>
              {submitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </form>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C.sub }}>
            <Filter size={14} /> Filter Board:
          </span>
          {['all', 'participant', 'team'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: 'none',
                background: filter === f ? 'var(--brand)' : 'var(--bg-elevated)',
                color: filter === f ? '#fff' : C.text,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {f === 'all' ? 'All Posts' : f === 'participant' ? 'Looking for Team' : 'Looking for Members'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : filteredPosts.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center', border: `1px solid ${C.border}`, borderRadius: 14, background: C.surface }}>
            <Users size={48} style={{ color: C.muted, marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, fontFamily: 'Sora, sans-serif' }}>Matchmaking board is empty</h3>
            <p style={{ color: C.sub }}>Be the first to post a recruitment or team-finding request!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filteredPosts.map(post => (
              <div 
                key={post._id} 
                className="card" 
                style={{ 
                  padding: 20, 
                  borderRadius: 14, 
                  border: `1px solid ${C.border}`, 
                  background: C.surface,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span style={{ 
                      padding: '3px 8px', 
                      borderRadius: 6, 
                      fontSize: 11, 
                      fontWeight: 700, 
                      background: post.type === 'team' ? 'var(--brand-dim)' : 'var(--accent-dim)',
                      color: post.type === 'team' ? 'var(--brand)' : 'var(--accent)'
                    }}>
                      {post.type === 'team' ? 'Seeking Members' : 'Seeking Team'}
                    </span>
                    {(post.user?._id === user?._id || user?.role === 'admin' || user?.role === 'organizer') && (
                      <button 
                        onClick={() => handleDelete(post._id)} 
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: C.text, fontFamily: 'Sora, sans-serif' }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 13, color: C.sub, marginBottom: 14, lineHeight: 1.5 }}>
                    {post.message}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {post.skills.map((skill, idx) => (
                      <span key={idx} style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4, color: C.text, fontWeight: 500 }}>
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                        {post.user?.name || 'Anonymous Hacker'}
                      </span>
                      <span style={{ fontSize: 10, color: C.muted }}>
                        {post.user?.email}
                      </span>
                    </div>

                    <a 
                      href={`mailto:${post.user?.email}?subject=HackForge Connect: Matchmaking Board`}
                      style={{ 
                        marginLeft: 'auto',
                        padding: '6px 12px', 
                        background: 'var(--text-primary)', 
                        color: 'var(--bg-surface)', 
                        fontSize: 11, 
                        fontWeight: 600, 
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Send size={12} /> Contact
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
