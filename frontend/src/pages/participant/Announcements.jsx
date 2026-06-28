import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { api } from '../../api';
import { Megaphone, Pin, AlertCircle, Info, CheckCircle } from 'lucide-react';

const TYPE_ICONS = {
  urgent: AlertCircle,
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
};

const TYPE_CLS = {
  urgent: 'urgent',
  info: '',
  warning: 'warning',
  success: '',
};

export default function ParticipantAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements').then(setAnnouncements).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const pinned = announcements.filter((a) => a.pinned);
  const regular = announcements.filter((a) => !a.pinned);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Official updates from the organizers</p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
        ) : announcements.length === 0 ? (
          <div className="empty-state card">
            <Megaphone size={36} />
            <h3>No announcements yet</h3>
            <p>Organizers will post updates here throughout the hackathon.</p>
          </div>
        ) : (
          <div>
            {pinned.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>Pinned</div>
                {pinned.map((a) => <AnnouncementCard key={a._id} announcement={a} />)}
              </div>
            )}
            {regular.map((a) => <AnnouncementCard key={a._id} announcement={a} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function AnnouncementCard({ announcement: a }) {
  const Icon = TYPE_ICONS[a.type] || Info;
  return (
    <div className={`announcement-card ${a.pinned ? 'pinned' : ''} ${TYPE_CLS[a.type] || ''}`} style={{ marginBottom: 10 }}>
      <div className="flex-between" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {a.pinned && <Pin size={12} style={{ color: 'var(--brand-light)' }} />}
          <span style={{ fontWeight: 700, fontSize: 14.5 }}>{a.title}</span>
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{a.body}</p>
      {a.createdBy && (
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>— {a.createdBy.name}</p>
      )}
    </div>
  );
}
