import React from 'react';

/**
 * Stat card grid showing location and connection stats.
 */
export default function StatusCard({ stats = [] }) {
  return (
    <div className="stat-grid">
      {stats.map((stat, i) => (
        <div key={i} className="stat-card animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="stat-label">{stat.label}</div>
          <div
            className="stat-value"
            style={{ color: stat.color || 'var(--color-text-primary)' }}
          >
            {stat.value ?? '—'}
          </div>
          {stat.sub && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {stat.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
