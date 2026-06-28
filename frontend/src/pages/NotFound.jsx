import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', textAlign: 'center', padding: 24 }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 96, fontWeight: 800, color: 'var(--bg-elevated)', lineHeight: 1, marginBottom: 16 }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 400 }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        <Home size={15} /> Go to Home
      </Link>
    </div>
  );
}
