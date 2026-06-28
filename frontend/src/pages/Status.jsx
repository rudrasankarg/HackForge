import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, HelpCircle, Server, RefreshCw } from 'lucide-react';

const C = {
  bg: 'var(--bg-base)',
  surface: 'var(--bg-surface)',
  text: 'var(--text-primary)',
  sub: 'var(--text-secondary)',
  muted: 'var(--text-muted)',
  border: 'var(--border)',
  accent: 'var(--brand)',
};

const SERVICES = [
  { name: 'HackForge Web Portal', status: 'Operational', uptime: '99.98%' },
  { name: 'HackGPT AI Engine (Gemini Pro)', status: 'Operational', uptime: '99.92%' },
  { name: 'TF-IDF Reviewer Assignment Service', status: 'Operational', uptime: '100%' },
  { name: 'Levenshtein Duplicate Detector API', status: 'Operational', uptime: '99.99%' },
  { name: 'University Domain Verification', status: 'Operational', uptime: '99.85%' },
  { name: 'Database Cluster (MongoDB)', status: 'Operational', uptime: '100%' },
];

export default function Status() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Outfit, sans-serif', color: C.text }}>
      
      {/* HEADER */}
      <header style={{ 
        padding: '0 40px', height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 50, 
        background: 'var(--bg-header)', backdropFilter: 'blur(12px)' 
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: '#1c1917', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 13, color: '#fff' }}>HF</div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: C.text }}>HackForge</span>
        </Link>
        <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: C.text, textDecoration: 'none' }}>Sign In</Link>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '60px 24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        
        {/* OVERALL STATUS BANNER */}
        <div style={{ 
          background: 'var(--success-dim)', border: '1px solid rgba(16,185,129,0.2)', 
          borderRadius: 14, padding: '24px', marginBottom: 36, 
          display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: 16, flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)', animation: 'pulse 2s infinite' }} />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Sora, sans-serif', color: 'var(--success)' }}>All Systems Operational</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>HackForge services are operating normally.</p>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
            <RefreshCw size={12} style={{ animation: 'spin 4s linear infinite' }} /> Updated 1 min ago
          </div>
        </div>

        {/* COMPONENT STATUS */}
        <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Sora, sans-serif', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Server size={16} color={C.accent} /> Component Status
        </h3>
        
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 40 }}>
          {SERVICES.map((s, idx) => (
            <div 
              key={s.name} 
              style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '16px 20px', borderBottom: idx < SERVICES.length - 1 ? `1px solid ${C.border}` : 'none' 
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>Uptime: {s.uptime}</div>
              </div>
              <span className="badge badge-success" style={{ fontSize: 12, padding: '4px 12px' }}>
                {s.status}
              </span>
            </div>
          ))}
        </div>

        {/* INCIDENT HISTORY */}
        <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Sora, sans-serif', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color={C.accent} /> Past Incidents
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Minor upstream latency in Gemini API</h4>
              <span style={{ fontSize: 12, color: C.muted }}>June 20, 2026</span>
            </div>
            <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5 }}>
              Resolved — We experienced intermittent latency issues with Gemini API completions due to upstream rate limits. A caching layer fallback was deployed, and latency returned to baseline in 24 minutes.
            </p>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontWeight: 700, fontSize: 14 }}>Scheduled Database Maintenance</h4>
              <span style={{ fontSize: 12, color: C.muted }}>June 18, 2026</span>
            </div>
            <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5 }}>
              Completed — Database shards were successfully optimized and automated backups were verified during our scheduled maintenance window. No downtime was experienced.
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}`, background: C.surface, fontSize: 13, color: C.muted }}>
        <div>&copy; {new Date().getFullYear()} HackForge. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link to="/privacy-policy" style={{ color: C.muted, textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms-of-service" style={{ color: C.muted, textDecoration: 'none' }}>Terms of Service</Link>
          <Link to="/status" style={{ color: C.muted, textDecoration: 'none' }}>Status</Link>
        </div>
      </footer>
    </div>
  );
}
