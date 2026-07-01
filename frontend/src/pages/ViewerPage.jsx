import React, { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket.js';
import { getSession, getLatestLocation } from '../services/api.js';
import Map from '../components/Map.jsx';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import StatusCard from '../components/StatusCard.jsx';

export default function ViewerPage() {
  const { trackingId } = useParams();
  const [location, setLocation] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);

  // Handler for incoming WebSocket location messages
  const onMessage = useCallback((data) => {
    setLocation(data);
    setUpdateCount((c) => c + 1);
  }, []);

  // Connect WebSocket and subscribe to /topic/track/{trackingId}
  const { isConnected, isConnecting, error: wsError } = useWebSocket({
    subscribeDestination: `/topic/track/${trackingId}`,
    onMessage,
    autoConnect: true,
  });

  // Fetch session info + latest location on mount (REST fallback for initial map center)
  useEffect(() => {
    getSession(trackingId)
      .then(setSessionInfo)
      .catch(() => setSessionError('Session not found or expired.'));

    getLatestLocation(trackingId).then((loc) => {
      if (loc) setLocation(loc);
    });
  }, [trackingId]);

  const formatCoord = (val) => val != null ? val.toFixed(6) : '—';
  const formatTime = (ts) => ts ? new Date(ts).toLocaleTimeString() : '—';

  const isExpired = sessionInfo?.status === 'EXPIRED';

  const stats = [
    {
      label: 'Latitude',
      value: formatCoord(location?.latitude),
      color: 'var(--color-accent-3)',
    },
    {
      label: 'Longitude',
      value: formatCoord(location?.longitude),
      color: 'var(--color-accent-3)',
    },
    {
      label: 'Last Update',
      value: location?.timestamp ? formatTime(location.timestamp) : '—',
      color: 'var(--color-text-primary)',
    },
    {
      label: 'Updates Received',
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
          {isExpired ? (
            <span className="badge badge-expired">EXPIRED</span>
          ) : (
            <ConnectionStatus
              isConnected={isConnected}
              isConnecting={isConnecting}
              error={wsError}
            />
          )}
        </div>
      </nav>

      {/* Error state */}
      {sessionError && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 'var(--space-lg)', padding: 'var(--space-3xl)' }}>
          <div style={{ fontSize: '3rem' }}>🔍</div>
          <h2>Session Not Found</h2>
          <p>The tracking session <code style={{ color: 'var(--color-accent-3)' }}>{trackingId}</code> doesn't exist or has expired.</p>
          <Link to="/" className="btn btn-primary">← Go Home</Link>
        </div>
      )}

      {!sessionError && (
        <main style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          height: 'calc(100vh - 65px)',
        }}>
          {/* Left: Full-height Map */}
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <Map
              lat={location?.latitude}
              lng={location?.longitude}
              followMarker={true}
              height="100%"
            />

            {/* Waiting overlay when no location yet */}
            {!location && !isExpired && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(10,15,30,0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 500,
                gap: 'var(--space-lg)',
              }}>
                <div className="spinner" style={{ width: '48px', height: '48px' }} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    Waiting for sender's location...
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>
                    The sender needs to open their share link and grant location access.
                  </p>
                </div>
              </div>
            )}

            {/* Expired overlay */}
            {isExpired && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(10,15,30,0.8)',
                backdropFilter: 'blur(4px)',
                zIndex: 500,
                gap: 'var(--space-lg)',
              }}>
                <div style={{ fontSize: '3rem' }}>🔒</div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    Session Expired
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>This tracking session is no longer active.</p>
                </div>
                <Link to="/" className="btn btn-secondary">← Go Home</Link>
              </div>
            )}

            {/* Live coordinate badge on map */}
            {location && (
              <div style={{
                position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000,
                background: 'rgba(10,15,30,0.85)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '10px 14px',
                backdropFilter: 'blur(8px)',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
              }}>
                📍 {formatCoord(location.latitude)}, {formatCoord(location.longitude)}
              </div>
            )}
          </div>

          {/* Right: Info panel */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)',
            padding: 'var(--space-xl)',
            borderLeft: '1px solid var(--color-border)',
            overflowY: 'auto',
            background: 'var(--color-bg-secondary)',
          }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '4px' }}>Live Tracker</h2>
              <p style={{ fontSize: '0.8125rem' }}>
                Viewing live location for session <span style={{ color: 'var(--color-accent-3)', fontFamily: 'monospace' }}>{trackingId}</span>
              </p>
            </div>

            {/* Stats */}
            <StatusCard stats={stats} />

            {/* Session info */}
            {sessionInfo && (
              <div style={{
                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
                fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Session Status</span>
                  <span className={`badge badge-${isExpired ? 'expired' : 'live'}`} style={{ fontSize: '0.7rem' }}>
                    {sessionInfo.status}
                  </span>
                </div>
                {sessionInfo.createdAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Started</span>
                    <span>{new Date(sessionInfo.createdAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            )}

            <div className="divider" style={{ margin: 0 }} />

            {/* How it works */}
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 2 }}>
              <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', fontSize: '0.8125rem' }}>How it works</div>
              <div>📡 Updates stream via WebSocket</div>
              <div>🗺️ Marker moves in real time</div>
              <div>👥 Multiple viewers supported</div>
              <div>🔒 Private session link</div>
            </div>

            <Link to="/" className="btn btn-secondary" style={{ textAlign: 'center', marginTop: 'auto' }}>
              ← Create New Session
            </Link>
          </div>
        </main>
      )}
    </div>
  );
}
