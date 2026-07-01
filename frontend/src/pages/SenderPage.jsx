import React, { useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { getSession } from '../services/api.js';
import Map from '../components/Map.jsx';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import StatusCard from '../components/StatusCard.jsx';
import CopyButton from '../components/CopyButton.jsx';

const SEND_INTERVAL_MS = 4000; // Send location every 4 seconds

export default function SenderPage() {
  const { trackingId } = useParams();
  const { position, error: geoError, permissionState } = useGeolocation();
  const { isConnected, isConnecting, error: wsError, sendLocation } = useWebSocket();

  const intervalRef = useRef(null);
  const updateCountRef = useRef(0);
  const [updateCount, setUpdateCount] = React.useState(0);
  const [sessionInfo, setSessionInfo] = React.useState(null);

  const viewUrl = `${window.location.origin}/track/${trackingId}`;

  // Fetch session metadata on mount
  useEffect(() => {
    getSession(trackingId)
      .then(setSessionInfo)
      .catch(() => setSessionInfo(null));
  }, [trackingId]);

  // Periodically send location when connected and have position
  const doSend = useCallback(() => {
    if (isConnected && position) {
      sendLocation(trackingId, position.latitude, position.longitude);
      updateCountRef.current += 1;
      setUpdateCount(updateCountRef.current);
    }
  }, [isConnected, position, sendLocation, trackingId]);

  useEffect(() => {
    if (isConnected && position) {
      // Send immediately on connect/position available
      doSend();
      intervalRef.current = setInterval(doSend, SEND_INTERVAL_MS);
    }
    return () => clearInterval(intervalRef.current);
  }, [isConnected, position, doSend]);

  const formatCoord = (val) => val != null ? val.toFixed(6) : '—';
  const formatAccuracy = (val) => val != null ? `± ${Math.round(val)}m` : '—';
  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString() : '—';

  const stats = [
    {
      label: 'Latitude',
      value: formatCoord(position?.latitude),
      color: 'var(--color-accent-3)',
    },
    {
      label: 'Longitude',
      value: formatCoord(position?.longitude),
      color: 'var(--color-accent-3)',
    },
    {
      label: 'Accuracy',
      value: formatAccuracy(position?.accuracy),
      color: position?.accuracy < 20 ? '#34d399' : '#fbbf24',
    },
    {
      label: 'Updates Sent',
      value: updateCount,
      color: 'var(--color-accent-1)',
    },
  ];

  return (
    <div className="page">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="navbar-brand" style={{ textDecoration: 'none' }}>⬡ LiveTrack</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
            {trackingId}
          </span>
          <ConnectionStatus
            isConnected={isConnected}
            isConnecting={isConnecting}
            error={wsError}
          />
        </div>
      </nav>

      <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 0, height: 'calc(100vh - 65px)' }}>

        {/* Left: Map */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <Map
            lat={position?.latitude}
            lng={position?.longitude}
            followMarker={true}
            height="100%"
          />

          {/* Floating status overlay on map */}
          {position && (
            <div style={{
              position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000,
              background: 'rgba(10,15,30,0.85)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '10px 14px',
              backdropFilter: 'blur(8px)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
            }}>
              📍 {formatCoord(position.latitude)}, {formatCoord(position.longitude)}
            </div>
          )}
        </div>

        {/* Right: Control panel */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)',
          padding: 'var(--space-xl)',
          borderLeft: '1px solid var(--color-border)',
          overflowY: 'auto',
          background: 'var(--color-bg-secondary)',
        }}>
          {/* Header */}
          <div>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '4px' }}>Sender Panel</h2>
            <p style={{ fontSize: '0.8125rem' }}>Your location is being shared live</p>
          </div>

          {/* Permission warning */}
          {permissionState === 'denied' && (
            <div style={{
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
              fontSize: '0.875rem', color: '#fda4af',
            }}>
              ⚠️ Location permission denied. Please enable it in your browser settings.
            </div>
          )}

          {geoError && permissionState !== 'denied' && (
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
              fontSize: '0.875rem', color: '#fbbf24',
            }}>
              ⚡ {geoError.message}
            </div>
          )}

          {/* Stats */}
          <StatusCard stats={stats} />

          {/* Last Update time */}
          {position && (
            <div style={{
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Last GPS fix</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(position.timestamp)}
              </span>
            </div>
          )}

          <div className="divider" style={{ margin: 0 }} />

          {/* Share viewer link */}
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: 'var(--space-sm)', color: 'var(--color-text-primary)' }}>
              👁 Viewer Link
            </p>
            <p style={{ fontSize: '0.75rem', marginBottom: 'var(--space-sm)', color: 'var(--color-text-muted)' }}>
              Share this link — anyone can track your location in real time
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <div className="url-share-box" style={{ flex: 1, fontSize: '0.75rem' }}>
                {viewUrl}
              </div>
              <CopyButton text={viewUrl} label="Copy" id="copy-viewer-link" />
            </div>
          </div>

          <div className="divider" style={{ margin: 0 }} />

          {/* Info */}
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
            <div>📡 Sending every {SEND_INTERVAL_MS / 1000}s via WebSocket</div>
            <div>🗺️ OpenStreetMap · Leaflet.js</div>
            {sessionInfo?.createdAt && (
              <div>🕐 Session started {new Date(sessionInfo.createdAt).toLocaleTimeString()}</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
