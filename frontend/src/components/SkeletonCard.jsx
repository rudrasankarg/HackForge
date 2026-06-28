import React from 'react';

export default function SkeletonCard({ type = 'stat', height }) {
  return (
    <div 
      className="card skeleton-shimmer-card" 
      style={{ 
        height: height || (type === 'stat' ? 110 : 'auto'), 
        position: 'relative', 
        overflow: 'hidden',
        padding: 20
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .skeleton-shimmer-card {
          border: 1px solid var(--border);
          background: var(--bg-surface);
        }
        .skeleton-shimmer-item {
          background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
          border-radius: 4px;
        }
      `}</style>
      {type === 'stat' ? (
        <>
          <div className="skeleton-shimmer-item" style={{ height: 12, width: '40%', marginBottom: 16 }} />
          <div className="skeleton-shimmer-item" style={{ height: 28, width: '60%', marginBottom: 12 }} />
          <div className="skeleton-shimmer-item" style={{ height: 4, width: '100%' }} />
        </>
      ) : (
        <>
          <div className="skeleton-shimmer-item" style={{ height: 16, width: '30%', marginBottom: 12 }} />
          <div className="skeleton-shimmer-item" style={{ height: 12, width: '90%', marginBottom: 8 }} />
          <div className="skeleton-shimmer-item" style={{ height: 12, width: '70%', marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton-shimmer-item" style={{ height: 20, width: 60 }} />
            <div className="skeleton-shimmer-item" style={{ height: 20, width: 80 }} />
          </div>
        </>
      )}
    </div>
  );
}
