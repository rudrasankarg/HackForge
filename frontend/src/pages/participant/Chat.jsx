import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { api } from '../../api';
import { Link, useSearchParams } from 'react-router-dom';
import { Globe, Users, Bot, Send, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';

export default function Chat() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'global');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [team, setTeam] = useState(null);
  const messagesEndRef = useRef(null);

  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');

  useEffect(() => {
    api.get('/hackathons')
      .then((list) => {
        setHackathons(list);
        if (list.length > 0) {
          setSelectedHackathonId(list[0]._id);
          loadTeamForHackathon(list[0]._id);
        }
      })
      .catch(console.error);
  }, []);

  const loadTeamForHackathon = (hId) => {
    api.get(`/teams/mine?hackathonId=${hId}`)
      .then(res => setTeam(res))
      .catch(() => setTeam(null));
  };

  const handleHackathonChange = (hId) => {
    setSelectedHackathonId(hId);
    loadTeamForHackathon(hId);
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    const validTabs = user?.role === 'participant'
      ? ['global', 'team', 'chatbot']
      : ['global', 'instructions'];

    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab('global');
    }
  }, [searchParams, user]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Compute room based on activeTab
  const getRoomName = () => {
    if (activeTab === 'global') return 'general';
    if (activeTab === 'instructions') return 'instructions';
    if (activeTab === 'team') return team ? `team-${team._id}` : null;
    if (activeTab === 'chatbot') return `chatbot-${user?._id}`;
    return null;
  };

  const room = getRoomName();

  useEffect(() => {
    if (!room) {
      setMessages([]);
      return;
    }

    // Load room history
    api.get(`/chat/${room}`)
      .then(res => {
        setMessages(res);
      })
      .catch(console.error);

    // Initialize Socket.io client
    const s = io('/', { query: { token: localStorage.getItem('hf_token') } });
    setSocket(s);

    // Join target room
    s.emit('join-room', room);

    // Listen to messages
    s.on('chat-message', (msg) => {
      // Append if it belongs to the current room
      if (msg.room === room) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [activeTab, room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBotTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput('');

    if (activeTab === 'chatbot') {
      setIsBotTyping(true);
      try {
        const res = await api.post('/chat/bot', { body: currentInput });
        // Append user query and AI response to messages
        setMessages(prev => [...prev, res.userMsg, res.botMsg]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsBotTyping(false);
      }
    } else {
      if (!room) return;
      api.post('/chat', { body: currentInput, room }).catch(console.error);
    }
  };

  const hasTeam = !!team;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0 }}>
        
        {/* Chat Header and Tab Switcher */}
        <div style={{ padding: '20px 32px 0 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeTab === 'global' && <><Globe size={20} className="text-brand" /> Global Hackathon Chat</>}
                {activeTab === 'team' && <><Users size={20} className="text-success" /> Private Team Chat</>}
                {activeTab === 'chatbot' && <><Bot size={20} className="text-brand" style={{ color: 'var(--accent)' }} /> HackGPT Assistant</>}
                {activeTab === 'instructions' && <><MessageSquare size={20} className="text-brand" /> Instructions Chat</>}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {activeTab === 'global' && 'Connect with participants, mentors, and admins across the entire hackathon.'}
                {activeTab === 'team' && 'Coordinate with your team members in complete privacy.'}
                {activeTab === 'chatbot' && 'Get instant guidance about rules, schedule, team stats, and submissions.'}
                {activeTab === 'instructions' && 'Private channel for organizers/admins to share instructions and coordinate with reviewers.'}
              </p>
            </div>
            {activeTab === 'team' && hackathons.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Hackathon:</span>
                <select
                  className="form-select"
                  value={selectedHackathonId}
                  onChange={(e) => handleHackathonChange(e.target.value)}
                  style={{ width: 'auto', minWidth: 200, margin: 0, padding: '6px 12px', fontSize: 13 }}
                >
                  {hackathons.map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid transparent', marginBottom: -1 }}>
            <button
              onClick={() => handleTabChange('global')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'global' ? '2px solid var(--brand)' : '2px solid transparent',
                color: activeTab === 'global' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'global' ? 600 : 500,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Globe size={15} />
              Global Chat
            </button>
            {user?.role === 'participant' && (
              <>
                <button
                  onClick={() => handleTabChange('team')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 18px',
                    border: 'none',
                    background: 'none',
                    borderBottom: activeTab === 'team' ? '2px solid var(--brand)' : '2px solid transparent',
                    color: activeTab === 'team' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === 'team' ? 600 : 500,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Users size={15} />
                  Team Chat
                </button>
                <button
                  onClick={() => handleTabChange('chatbot')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 18px',
                    border: 'none',
                    background: 'none',
                    borderBottom: activeTab === 'chatbot' ? '2px solid var(--brand)' : '2px solid transparent',
                    color: activeTab === 'chatbot' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === 'chatbot' ? 600 : 500,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Bot size={15} />
                  HackGPT AI
                </button>
              </>
            )}

            {(user?.role === 'admin' || user?.role === 'reviewer' || user?.role === 'organizer') && (
              <button
                onClick={() => handleTabChange('instructions')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 18px',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'instructions' ? '2px solid var(--brand)' : '2px solid transparent',
                  color: activeTab === 'instructions' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'instructions' ? 600 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <MessageSquare size={15} />
                Instructions Chat
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages Panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--bg-base)' }}>
          {activeTab === 'team' && !hasTeam ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              padding: 40,
            }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--warning-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, margin: '0 auto 16px auto' }}>
                <ShieldAlert size={32} style={{ color: 'var(--warning)' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Team Active</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, marginBottom: 24 }}>
                You must join or create a team before accessing the private team chat.
              </p>
              <Link to="/participant/team" className="btn btn-primary">
                Go to Teams Page
              </Link>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => {
                const senderIdStr = msg.sender?._id || msg.sender;
                const isMe = senderIdStr === user?._id;
                
                // If it is a chatbot assistant reply
                const isAI = msg.aiGenerated || msg.senderName === 'HackGPT Assistant';
                const senderName = isAI ? 'HackGPT Assistant' : (msg.senderName || (msg.sender && msg.sender.name) || 'Unknown User');
                const senderRole = isAI ? 'AI Helper' : (msg.senderRole || (msg.sender && msg.sender.role));

                return (
                  <div key={msg._id || i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe && !isAI ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        color: isMe && !isAI ? 'var(--brand-light)' : isAI ? 'var(--accent)' : 'var(--text-secondary)' 
                      }}>
                        {isMe && !isAI ? 'You' : senderName}
                      </span>
                      {senderRole && (
                        <span className={`badge ${isAI ? 'badge-accent' : 'badge-muted'}`} style={{ fontSize: 9, padding: '1px 6px' }}>
                          {senderRole}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ 
                      background: isMe && !isAI ? 'var(--brand)' : isAI ? 'var(--bg-elevated)' : 'var(--bg-card)', 
                      color: isMe && !isAI ? 'white' : 'var(--text-primary)',
                      padding: '12px 16px', 
                      borderRadius: isMe && !isAI ? '16px 16px 0 16px' : '16px 16px 16px 0',
                      border: isMe && !isAI ? 'none' : isAI ? '1px solid var(--brand-border)' : '1px solid var(--border)',
                      maxWidth: '75%',
                      fontSize: 14,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      boxShadow: isAI ? '0 0 16px var(--brand-dim)' : 'none',
                    }}>
                      {isAI && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>
                          <Sparkles size={11} /> Response powered by Gemini
                        </div>
                      )}
                      {msg.body}
                    </div>
                  </div>
                );
              })}

              {isBotTyping && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>HackGPT Assistant</span>
                    <span className="badge badge-accent" style={{ fontSize: 9, padding: '1px 6px' }}>Thinking...</span>
                  </div>
                  <div style={{ 
                    background: 'var(--bg-elevated)', 
                    padding: '12px 16px', 
                    borderRadius: '16px 16px 16px 0',
                    border: '1px solid var(--brand-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: 'var(--text-secondary)'
                  }}>
                    <div className="spinner" style={{ width: 14, height: 14 }} />
                    Generating response...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        {!(activeTab === 'team' && !hasTeam) && (
          <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: 12 }}>
              <input 
                type="text" 
                className="form-input" 
                style={{ flex: 1, borderRadius: 99, paddingLeft: 20 }} 
                placeholder={activeTab === 'chatbot' ? "Ask HackGPT a question..." : "Type your message..."}
                value={input} 
                onChange={e => setInput(e.target.value)}
                disabled={activeTab === 'chatbot' && isBotTyping}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ borderRadius: 99, padding: '0 24px' }} 
                disabled={!input.trim() || (activeTab === 'chatbot' && isBotTyping)}
              >
                <Send size={14} style={{ marginRight: 2 }} />
                Send
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
