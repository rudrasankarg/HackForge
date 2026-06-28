import React from 'react';
import * as Icons from 'lucide-react';

export default function EmptyState({ title, subtitle, icon }) {
  const IconComponent = icon && Icons[icon] ? Icons[icon] : Icons.Inbox;

  return (
    <div 
      className="empty-state card" 
      style={{ 
        textAlign: 'center', 
        padding: '48px 24px', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      <div 
        style={{ 
          width: 56, 
          height: 56, 
          borderRadius: '50%', 
          background: 'var(--bg-elevated)', 
          border: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          marginBottom: 16
        }}
      >
        <IconComponent size={24} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
        {subtitle}
      </p>
    </div>
  );
}
