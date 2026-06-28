import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Shield, Landmark, AlertOctagon, RefreshCw } from 'lucide-react';

const C = {
  bg: 'var(--bg-base)',
  surface: 'var(--bg-surface)',
  text: 'var(--text-primary)',
  sub: 'var(--text-secondary)',
  muted: 'var(--text-muted)',
  border: 'var(--border)',
  accent: 'var(--brand)',
};

export default function TermsOfService() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--brand-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <Scale size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Sora, sans-serif' }}>Terms of Service</h1>
            <p style={{ fontSize: 13, color: C.muted }}>Last Updated: June 21, 2026</p>
          </div>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.7, color: C.sub, marginBottom: 32 }}>
          Welcome to HackForge. Please read these Terms of Service ("Terms") carefully. By registering for, logging in to, or using the HackForge platform, you agree to be bound by these Terms and our Privacy Policy.
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Sora, sans-serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Landmark size={16} color={C.accent} /> 1. Eligibility & Registration
          </h2>
          <ul style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: C.sub, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong>Participant Accounts:</strong> Participants must register using valid credentials. University domains are checked via our verification microservices.</li>
            <li><strong>Organizer Accounts:</strong> Formal company representatives must upload valid employee ID cards. Verification is subject to automated inspection and administrator validation.</li>
            <li><strong>Account Security:</strong> You are solely responsible for maintaining the confidentiality of your credentials and all activities occurring under your account.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Sora, sans-serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color={C.accent} /> 2. Hackathon Conduct & Fair Play
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: C.sub, marginBottom: 10 }}>
            HackForge promotes innovation and fair competition. You agree NOT to:
          </p>
          <ul style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: C.sub, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Submit plagiarized projects or code written before the hackathon registration period. All project repositories are screened by similarity detection algorithms.</li>
            <li>Create duplicate or spam participant profiles. The platform uses intelligent deduplication to identify matching registration metadata.</li>
            <li>Engage in malicious comments or harassment. Team chats are continuously scanned for safety compliance.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Sora, sans-serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertOctagon size={16} color={C.accent} /> 3. Intellectual Property Rights
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: C.sub }}>
            Participants retain full ownership of the intellectual property (IP) for projects and code developed during events. By submitting a project, you grant organizers and reviewers a limited, non-exclusive license to view, test, and evaluate your submission.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Sora, sans-serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={16} color={C.accent} /> 4. Platform Modifications & Termination
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: C.sub }}>
            We reserve the right to suspend accounts, disqualify project submissions, or modify the services at any time. Violations of the Code of Conduct or attempting to exploit automated reviewer systems will result in immediate suspension and blacklisting from future HackForge events.
          </p>
        </section>
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
