import React, { useState } from 'react';
import { api } from '../api';
import { MessageSquare, Send, CornerDownRight } from 'lucide-react';
import { toast } from '../utils/toast';

export default function ProjectQA({ projectId, initialQuestions = [] }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [newQuestion, setNewQuestion] = useState('');
  const [replyText, setReplyText] = useState({}); // { [questionId]: '' }
  const [submitting, setSubmitting] = useState(false);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    setSubmitting(true);
    try {
      const question = await api.post(`/projects/${projectId}/questions`, { text: newQuestion });
      setQuestions([...questions, question]);
      setNewQuestion('');
      toast.success('Question posted successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostAnswer = async (e, questionId) => {
    e.preventDefault();
    const text = replyText[questionId];
    if (!text || !text.trim()) return;

    setSubmitting(true);
    try {
      const updatedQuestion = await api.post(`/projects/${projectId}/questions/${questionId}/answers`, { text });
      setQuestions(questions.map(q => q._id === questionId ? updatedQuestion : q));
      setReplyText({ ...replyText, [questionId]: '' });
      toast.success('Reply posted successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ padding: 22, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-surface)', marginTop: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, fontFamily: 'Sora, sans-serif', display: 'flex', alignItems: 'center', gap: 8 }}>
        <MessageSquare size={16} color="var(--brand)" /> Interactive Project Q&A Portal
      </h3>

      {/* Ask Question Form */}
      <form onSubmit={handleAskQuestion} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Ask a question about this project..."
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 13 }}
        />
        <button type="submit" disabled={submitting || !newQuestion.trim()} className="btn btn-primary" style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Send size={12} /> Ask
        </button>
      </form>

      {/* Questions list */}
      {questions.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>No questions asked yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {questions.map((q) => (
            <div key={q._id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
              {/* Question */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{q.asker?.name}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: q.asker?.role === 'reviewer' ? 'var(--brand-dim)' : 'var(--accent-dim)', color: q.asker?.role === 'reviewer' ? 'var(--brand)' : 'var(--accent)', textTransform: 'uppercase' }}>
                    {q.asker?.role}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {new Date(q.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', paddingLeft: 2 }}>{q.text}</p>
              </div>

              {/* Answers */}
              {q.answers && q.answers.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginLeft: 16, borderLeft: '2px solid var(--border)', paddingLeft: 12, marginBottom: 10 }}>
                  {q.answers.map((ans) => (
                    <div key={ans._id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CornerDownRight size={12} color="var(--text-muted)" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{ans.responder?.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'var(--success-dim)', color: 'var(--success)', textTransform: 'uppercase' }}>
                          {ans.responder?.role}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          {new Date(ans.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 20 }}>{ans.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <form onSubmit={(e) => handlePostAnswer(e, q._id)} style={{ display: 'flex', gap: 10, marginLeft: 16 }}>
                <input
                  type="text"
                  placeholder="Post a reply..."
                  value={replyText[q._id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [q._id]: e.target.value })}
                  style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: 12 }}
                />
                <button type="submit" disabled={submitting || !(replyText[q._id] || '').trim()} className="btn btn-secondary btn-sm" style={{ padding: '0 12px', fontSize: 11 }}>
                  Reply
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
