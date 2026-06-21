import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { LifeBuoy, Send, MessageSquare, AlertCircle, CheckCircle2, Plus, Tag, Clock } from 'lucide-react';

const C = {
  bg:      'var(--bg-base)',
  surface: 'var(--bg-surface)',
  border:  'var(--border)',
  text:    'var(--text-primary)',
  sub:     'var(--text-secondary)',
  muted:   'var(--text-muted)',
  brand:   'var(--brand)',
};

const CATEGORIES = [
  { value: 'technical',  label: 'Technical Support' },
  { value: 'logistics',  label: 'Event Logistics'   },
  { value: 'judging',    label: 'Judging & Rules'   },
  { value: 'other',      label: 'Other Queries'     },
];

const STATUS = {
  open:          { bg: 'rgba(99,102,241,0.08)',   color: '#6366f1', label: 'Open'        },
  'in-progress': { bg: 'rgba(245,158,11,0.08)',   color: '#d97706', label: 'In Progress' },
  resolved:      { bg: 'rgba(16,185,129,0.08)',   color: '#059669', label: 'Resolved'    },
};

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.open;
  return <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:99, background:s.bg, color:s.color, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</span>;
}

const inputStyle = { width:'100%', background:'#f8fafc', border:'1px solid rgba(15,23,42,0.12)', borderRadius:9, padding:'0 14px', height:44, color:C.text, fontSize:13.5, outline:'none', boxSizing:'border-box', fontFamily:'Outfit,sans-serif', transition:'border-color 0.15s' };

export default function HelpDesk() {
  const { user } = useAuth();
  const [tickets, setTickets]               = useState([]);
  const [hackathons, setHackathons]         = useState([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [loading, setLoading]               = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreate, setShowCreate]         = useState(false);
  const [form, setForm]                     = useState({ subject:'', category:'technical', description:'', hackathonId:'' });
  const [replyText, setReplyText]           = useState('');
  const [error, setError]                   = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const repliesEndRef = useRef(null);

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const updated = await api.patch(`/tickets/${selectedTicket._id}/status`, { status: 'resolved' });
      setSelectedTicket(updated);
      setTickets(p => p.map(t => t._id === updated._id ? updated : t));
    } catch (err) {
      setError(err.message || 'Failed to resolve ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // Fetch hackathons to populate filters and dropdowns
    api.get('/hackathons')
      .then(res => {
        setHackathons(res);
      })
      .catch(() => {});
    fetchTickets();
  }, []);

  useEffect(() => { repliesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [selectedTicket?.replies]);

  const fetchTickets = async (hackathonId = '') => {
    setLoading(true);
    try {
      const url = hackathonId ? `/tickets?hackathonId=${hackathonId}` : '/tickets';
      setTickets(await api.get(url));
    } catch {}
    finally { setLoading(false); }
  };

  const handleHackathonFilterChange = (e) => {
    const id = e.target.value;
    setSelectedHackathonId(id);
    fetchTickets(id);
  };

  const handleSelectTicket = async id => {
    try { setSelectedTicket(await api.get(`/tickets/${id}`)); setShowCreate(false); } catch { setError('Could not open ticket.'); }
  };

  const handleCreateSubmit = async e => {
    e.preventDefault();
    if (!form.subject || !form.description) { setError('All fields are required.'); return; }
    if (!form.hackathonId) { setError('Please select a scope.'); return; }
    setSubmitting(true); setError('');
    try {
      const t = await api.post('/tickets', form);
      setTickets(p => [t,...p]);
      setForm({ subject:'', category:'technical', description:'', hackathonId: '' });
      setSelectedTicket(t); setShowCreate(false);
    } catch (err) { setError(err.message || 'Failed to submit.'); }
    finally { setSubmitting(false); }
  };

  const handleReplySubmit = async e => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setSubmitting(true);
    try {
      const u = await api.post(`/tickets/${selectedTicket._id}/reply`, { body: replyText });
      setSelectedTicket(u); setTickets(p => p.map(t => t._id === u._id ? u : t)); setReplyText('');
    } catch { setError('Failed to send.'); }
    finally { setSubmitting(false); }
  };

  const getCatLabel = v => CATEGORIES.find(c => c.value === v)?.label || v;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg }}>
      <Sidebar />
      <div style={{ flex:1, marginLeft:240, display:'flex', flexDirection:'column', minHeight:'100vh' }}>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:60, borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'rgba(239,68,68,0.07)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <LifeBuoy size={16} color="#dc2626" strokeWidth={2} />
            </div>
            <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:16, color:C.text }}>Help Desk</span>
          </div>
          <button onClick={() => { setShowCreate(true); setSelectedTicket(null); setError(''); }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'0 16px', height:36, background:C.brand, color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600 }}
            onMouseEnter={e => e.currentTarget.style.background='#4f46e5'} onMouseLeave={e => e.currentTarget.style.background=C.brand}>
            <Plus size={14} strokeWidth={2.5} /> New Ticket
          </button>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          {/* LEFT list */}
          <div style={{ width:280, flexShrink:0, borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', background:C.surface, overflowY:'auto' }}>
            <div style={{ padding:'12px 14px', borderBottom:`1px solid rgba(15,23,42,0.06)`, display:'flex', flexDirection:'column', gap:8 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:C.muted }}>Tickets ({tickets.length})</span>
              <select value={selectedHackathonId} onChange={handleHackathonFilterChange} style={{ width:'100%', height:32, borderRadius:6, border:`1px solid ${C.border}`, background:C.bg, fontSize:12, color:C.text, outline:'none', padding:'0 8px' }}>
                <option value="">All Scopes</option>
                {['admin', 'participant'].includes(user?.role) && (
                  <option value="website">Website / Platform</option>
                )}
                {hackathons.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
              </select>
            </div>
            {loading ? <div style={{ padding:40, display:'flex', justifyContent:'center' }}><div className="spinner" /></div>
              : tickets.length === 0 ? <div style={{ padding:'32px 20px', textAlign:'center', color:C.muted, fontSize:13 }}>No tickets yet.<br/><span style={{ fontSize:12 }}>Click "New Ticket" above.</span></div>
              : <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:3 }}>
                  {tickets.map(t => {
                    const active = selectedTicket?._id === t._id;
                    return (
                      <div key={t._id} onClick={() => handleSelectTicket(t._id)}
                        style={{ padding:'11px 13px', borderRadius:9, cursor:'pointer', background: active ? 'rgba(99,102,241,0.07)' : 'transparent', border:`1px solid ${active ? 'rgba(99,102,241,0.22)' : 'transparent'}`, transition:'all 0.14s' }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background='var(--bg-elevated)'; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background='transparent'; }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                          <StatusPill status={t.status} />
                          <span style={{ fontSize:10, color:C.muted }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', marginBottom:3 }}>{t.subject}</div>
                        <div style={{ fontSize:11, color:C.muted, display:'flex', alignItems:'center', gap:4, justifyContent:'space-between' }}>
                          <span style={{ display:'flex', alignItems:'center', gap:4 }}><Tag size={10} />{getCatLabel(t.category)}</span>
                          <span style={{ fontSize:10.5, color:C.brand, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120 }} title={t.hackathonId ? t.hackathonId.name : "Website / Platform"}>
                            {t.hackathonId ? t.hackathonId.name : "Website / Platform"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
            }
          </div>

          {/* RIGHT detail */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            {showCreate ? (
              <div style={{ flex:1, overflowY:'auto', padding:'40px 48px' }}>
                <div style={{ maxWidth:540 }}>
                  <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:20, fontWeight:700, color:C.text, marginBottom:6 }}>Create Support Request</h2>
                  <p style={{ fontSize:13.5, color:C.sub, marginBottom:28 }}>Mentors and organizers will respond shortly.</p>
                  {error && <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderRadius:9, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', color:'#dc2626', fontSize:13, marginBottom:16 }}><AlertCircle size={14}/>{error}</div>}
                  <form onSubmit={handleCreateSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                    <div>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7 }}>Scope</label>
                      <select value={form.hackathonId} onChange={e=>setForm(p=>({...p,hackathonId:e.target.value}))} style={{ ...inputStyle }} required>
                        <option value="">Select Scope</option>
                        <option value="website">Website / Platform (Admin Only)</option>
                        {hackathons.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                      </select>
                    </div>
                    {[
                      { label:'Subject', type:'input', key:'subject', placeholder:'Brief title of the issue' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7 }}>{f.label}</label>
                        <input type="text" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))} style={inputStyle} onFocus={e=>e.target.style.borderColor='rgba(99,102,241,0.45)'} onBlur={e=>e.target.style.borderColor='rgba(15,23,42,0.12)'} required />
                      </div>
                    ))}
                    <div>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7 }}>Category</label>
                      <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={{ ...inputStyle }} onFocus={e=>e.target.style.borderColor='rgba(99,102,241,0.45)'} onBlur={e=>e.target.style.borderColor='rgba(15,23,42,0.12)'}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7 }}>Description</label>
                      <textarea rows={5} placeholder="Describe the issue in detail..." value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ ...inputStyle, height:'auto', padding:'12px 14px', resize:'vertical', lineHeight:1.6 }} onFocus={e=>e.target.style.borderColor='rgba(99,102,241,0.45)'} onBlur={e=>e.target.style.borderColor='rgba(15,23,42,0.12)'} required />
                    </div>
                    <div style={{ display:'flex', gap:10 }}>
                      <button type="submit" disabled={submitting} style={{ padding:'0 24px', height:42, background:C.brand, color:'#fff', border:'none', borderRadius:9, fontSize:13.5, fontWeight:600, cursor:'pointer' }}>{submitting?'Submitting…':'Submit Ticket'}</button>
                      <button type="button" onClick={()=>{setShowCreate(false);setError('');}} style={{ padding:'0 18px', height:42, background:'#f1f5f9', color:C.sub, border:`1px solid ${C.border}`, borderRadius:9, fontSize:13.5, cursor:'pointer' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            ) : selectedTicket ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                <div style={{ padding:'14px 24px', borderBottom:`1px solid ${C.border}`, background:C.surface, flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
                      <span style={{ fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:15, color:C.text }}>{selectedTicket.subject}</span>
                      <StatusPill status={selectedTicket.status} />
                    </div>
                    <span style={{ fontSize:12, color:C.muted }}>{getCatLabel(selectedTicket.category)} · {new Date(selectedTicket.createdAt).toLocaleDateString()}{` · Scope: ${selectedTicket.hackathonId ? selectedTicket.hackathonId.name : "Website / Platform"}`}</span>
                  </div>
                  {['admin', 'organizer', 'reviewer'].includes(user?.role) && selectedTicket.status !== 'resolved' && (
                    <button onClick={handleResolveTicket} disabled={submitting}
                      style={{ padding:'0 14px', height:32, background:'#10b981', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#059669'} onMouseLeave={e => e.currentTarget.style.background='#10b981'}>
                      {submitting ? 'Closing...' : '✓ Resolve & Close'}
                    </button>
                  )}
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:'24px 32px', display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ padding:'16px 20px', borderRadius:12, background:C.surface, border:`1px solid ${C.border}`, maxWidth:680 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(99,102,241,0.1)', color:C.brand, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{selectedTicket.userId?.name?.charAt(0).toUpperCase()||'?'}</div>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{selectedTicket.userId?.name}</span>
                      <span style={{ fontSize:11, color:C.muted }}>Original request</span>
                    </div>
                    <p style={{ fontSize:13.5, color:C.sub, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{selectedTicket.description}</p>
                    <span style={{ fontSize:11, color:C.muted, display:'block', marginTop:8 }}>{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedTicket.replies?.map((r, i) => {
                    const isStaff = r.senderRole === 'admin' || r.senderRole === 'organizer' || r.senderRole === 'reviewer';
                    return (
                      <div key={r._id||i} style={{ padding:'16px 20px', borderRadius:12, background: isStaff ? 'rgba(99,102,241,0.04)' : C.surface, border:`1px solid ${isStaff ? 'rgba(99,102,241,0.18)' : C.border}`, maxWidth:680, alignSelf: isStaff ? 'flex-end' : 'flex-start' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background: isStaff ? C.brand : '#f1f5f9', color: isStaff ? '#fff' : C.sub, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{r.senderName?.charAt(0).toUpperCase()||'?'}</div>
                          <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{r.senderName}</span>
                          {isStaff && <span style={{ padding:'2px 6px', borderRadius:4, background:'rgba(99,102,241,0.1)', color:C.brand, fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{r.senderRole}</span>}
                        </div>
                        <p style={{ fontSize:13.5, color:C.sub, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{r.body}</p>
                        <span style={{ fontSize:11, color:C.muted, display:'block', marginTop:8 }}>{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                    );
                  })}
                  <div ref={repliesEndRef} />
                </div>
                {selectedTicket.status !== 'resolved' ? (
                  <form onSubmit={handleReplySubmit} style={{ padding:'12px 24px', borderTop:`1px solid ${C.border}`, background:C.surface, display:'flex', gap:10, flexShrink:0 }}>
                    <input type="text" placeholder="Type your reply…" value={replyText} onChange={e=>setReplyText(e.target.value)} style={{ ...inputStyle, flex:1 }} onFocus={e=>e.target.style.borderColor='rgba(99,102,241,0.45)'} onBlur={e=>e.target.style.borderColor='rgba(15,23,42,0.12)'} required />
                    <button type="submit" disabled={submitting||!replyText.trim()} style={{ width:44, height:44, borderRadius:9, background:replyText.trim()?C.brand:'#e2e8f0', border:'none', cursor:replyText.trim()?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', transition:'background 0.15s' }}><Send size={17} strokeWidth={2}/></button>
                  </form>
                ) : (
                  <div style={{ padding:'14px 24px', borderTop:`1px solid ${C.border}`, background:C.surface, display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'#059669', fontSize:13 }}>
                    <CheckCircle2 size={15}/> This ticket has been resolved.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:40, textAlign:'center' }}>
                <div style={{ width:56, height:56, borderRadius:16, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:8 }}>
                  <MessageSquare size={24} color="#dc2626" strokeWidth={1.5}/>
                </div>
                <h3 style={{ fontFamily:'Sora,sans-serif', fontSize:17, fontWeight:700, color:C.text }}>Mentor Support Center</h3>
                <p style={{ fontSize:13.5, color:C.muted, maxWidth:300, lineHeight:1.6 }}>Select a ticket from the list, or raise a new one to get help from organizers and mentors.</p>
                <button onClick={()=>{setShowCreate(true);setSelectedTicket(null);}} style={{ marginTop:8, padding:'0 18px', height:40, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', color:'#dc2626', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  <Plus size={14} strokeWidth={2.5}/> Raise a Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
