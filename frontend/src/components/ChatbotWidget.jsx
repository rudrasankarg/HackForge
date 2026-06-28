import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function ChatbotWidget() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    // Load personal assistant history
    api.get(`/chat/chatbot-${user._id}`)
      .then(res => setMessages(res))
      .catch(console.error);
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput('');
    
    // Add user query immediately
    setMessages(prev => [...prev, { senderName: 'You', body: currentInput, createdAt: new Date() }]);
    setIsBotTyping(true);

    try {
      const res = await api.post('/chat/bot', { body: currentInput });
      // Replace last message and append bot response to match server model
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = res.userMsg;
        return [...updated, res.botMsg];
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsBotTyping(false);
    }
  };

  if (!user || location.pathname === '/participant/chat') return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, fontFamily: 'var(--font-sans, sans-serif)' }}>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand), var(--accent))',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            margin: 0,
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4), var(--shadow-glow)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Bot size={24} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div style={{
          width: 360,
          height: 480,
          background: 'var(--bg-surface)',
          border: '1px solid var(--brand-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md), var(--shadow-glow)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, var(--bg-elevated), var(--brand-dim))',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot size={20} className="text-brand" style={{ color: 'var(--accent)' }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>HackGPT Helper</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Personal AI Assistant</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            background: 'var(--bg-base)',
          }}>
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              padding: '10px 12px',
              borderRadius: '12px 12px 12px 0',
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}>
              👋 Hi {user.name}! I'm HackGPT. Ask me anything about hackathon rules, schedule, prizes, or your team statistics!
            </div>

            {messages.map((msg, i) => {
              const isMe = msg.senderName === 'You' || msg.sender === user._id || msg.sender?._id === user._id;
              const isAI = msg.aiGenerated || msg.senderName === 'HackGPT Assistant';
              return (
                <div key={msg._id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe && !isAI ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: isMe && !isAI ? 'var(--brand)' : 'var(--bg-elevated)',
                    color: isMe && !isAI ? '#fff' : 'var(--text-primary)',
                    padding: '8px 12px',
                    borderRadius: isMe && !isAI ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    border: isMe && !isAI ? 'none' : isAI ? '1px solid var(--brand-border)' : '1px solid var(--border)',
                    maxWidth: '85%',
                    fontSize: 13,
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                  }}>
                    {isAI && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>
                        <Sparkles size={9} /> Gemini
                      </div>
                    )}
                    {msg.body}
                  </div>
                </div>
              );
            })}

            {isBotTyping && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--brand-border)',
                  padding: '8px 12px',
                  borderRadius: '12px 12px 12px 0',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div className="spinner" style={{ width: 12, height: 12 }} />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSend} style={{
            padding: 12,
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
          }}>
            <input
              type="text"
              className="form-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              style={{ flex: 1, fontSize: 13, padding: '8px 12px', borderRadius: 99 }}
              disabled={isBotTyping}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '8px 12px', borderRadius: 99 }}
              disabled={!input.trim() || isBotTyping}
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      )}

      {/* CSS Animation keyframe for slideUp */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
