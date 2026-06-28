import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', textAlign: 'center', padding: 24 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: 'var(--danger)' }}>
        <ShieldOff size={28} />
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Access Denied</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 400 }}>
        You do not have permission to view this page. If you believe this is an error, contact the organizer.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Go Back
        </button>
        <Link to="/dashboard" className="btn btn-primary">My Dashboard</Link>
      </div>
    </div>
  );
}
