import React from 'react';

/**
 * Animated "LIVE" badge indicating active connection status.
 */
export default function LiveBadge({ status = 'live' }) {
  const config = {
    live: {
      className: 'badge badge-live',
      dotClass: 'pulse-dot',
      label: 'LIVE',
    },
    connecting: {
      className: 'badge badge-connecting',
      dotClass: 'pulse-dot pulse-dot-warning',
      label: 'CONNECTING',
    },
    offline: {
      className: 'badge badge-offline',
      dotClass: '',
      label: 'OFFLINE',
    },
    expired: {
      className: 'badge badge-expired',
      dotClass: '',
      label: 'EXPIRED',
    },
  };

  const { className, dotClass, label } = config[status] || config.offline;

  return (
    <span className={className} id={`live-badge-${status}`}>
      {dotClass && <span className={dotClass} />}
      {label}
    </span>
  );
}
