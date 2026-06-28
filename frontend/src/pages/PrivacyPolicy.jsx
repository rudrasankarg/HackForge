import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Eye, FileText, CheckCircle } from 'lucide-react';

const C = {
  bg: 'var(--bg-base)',
  surface: 'var(--bg-surface)',
  text: 'var(--text-primary)',
  sub: 'var(--text-secondary)',
  muted: 'var(--text-muted)',
  border: 'var(--border)',
  accent: 'var(--brand)',
};

export default function PrivacyPolicy() {
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
            <Shield size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'Sora, sans-serif' }}>Privacy Policy</h1>
            <p style={{ fontSize: 13, color: C.muted }}>Last Updated: June 21, 2026</p>
          </div>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.7, color: C.sub, marginBottom: 32 }}>
          At HackForge, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including registration logs, AI matching models, evaluations, and dashboards.
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Sora, sans-serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color={C.accent} /> 1. Information We Collect
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: C.sub, marginBottom: 10 }}>
            We collect information that you directly provide to us, as well as data automatically generated during hackathon participation:
          </p>
          <ul style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: C.sub, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong>Account Profile Data:</strong> Name, email address, password, institution/university, skills, experience level, and github/linkedin profiles.</li>
            <li><strong>Organizer Registrations:</strong> Company names, websites, employee IDs, and digital identification card images for AI verification purposes.</li>
            <li><strong>Intelligent Processing Data:</strong> Text extractions of your resume or profile details, and Levenshtein distance calculations to screen for duplicate accounts.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Sora, sans-serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={16} color={C.accent} /> 2. How We Use Your Information
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: C.sub, marginBottom: 10 }}>
            HackForge uses advanced algorithms and AI models to run events smoothly. Your data is used for:
          </p>
          <ul style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.6, color: C.sub, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li><strong>Matchmaking:</strong> Running TF-IDF and cosine similarity engines to pair participant skills with team requirements and project submissions.</li>
            <li><strong>Outlier & Bias Detection:</strong> Performing Z-score and statistical checks on reviewer evaluations to highlight anomalies and ensure fairness.</li>
            <li><strong>Communication:</strong> Delivering platform notifications, announcements, helpdesk tickets, and OTP codes securely.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Sora, sans-serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={16} color={C.accent} /> 3. Data Protection and Retention
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: C.sub }}>
            We implement modern security measures including JWT session tokens, token blacklisting upon logout, and database access controls. Your profile data is stored securely using MongoDB and persists across Docker instances unless explicitly requested for deletion. We never sell your personal information to third-party advertisers.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Sora, sans-serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} color={C.accent} /> 4. Your Rights
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: C.sub }}>
            You have the right to access, edit, or delete your profile information, manage your active hackathon teams, and review grades or evaluations. You may contact support at <a href="mailto:support@hackforge.dev">support@hackforge.dev</a> for questions or data request queries.
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
