import React from 'react';
import LiveBadge from './LiveBadge.jsx';

/**
 * Connection status bar — shows badge + descriptive message.
 */
export default function ConnectionStatus({ isConnected, isConnecting, error }) {
  let status, message;

  if (isConnecting) {
    status = 'connecting';
    message = 'Establishing connection...';
  } else if (isConnected) {
    status = 'live';
    message = 'Connected — updates are streaming';
  } else if (error) {
    status = 'offline';
    message = error;
  } else {
    status = 'offline';
    message = 'Disconnected';
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: '0.5rem var(--space-md)',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-full)',
        width: 'fit-content',
      }}
      id="connection-status"
    >
      <LiveBadge status={status} />
      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
        {message}
      </span>
    </div>
  );
}
