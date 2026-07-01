import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../services/api.js';
import CopyButton from '../components/CopyButton.jsx';

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleCreateSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await createSession();
      // Override URLs to use the current public origin (works with any tunnel/domain)
      const origin = window.location.origin;
      data.shareUrl = `${origin}/share/${data.trackingId}`;
      data.viewUrl  = `${origin}/track/${data.trackingId}`;
      setSession(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to create session. Is the backend running?'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Navbar */}
      <nav className="navbar">
        <span className="navbar-brand">⬡ LiveTrack</span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Real-Time Location Sharing
        </span>
      </nav>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-3xl) var(--space-lg)' }}>

        {/* Hero Text */}
        <div className="animate-fadeInUp" style={{ textAlign: 'center', maxWidth: '680px', marginBottom: 'var(--space-3xl)' }}>
          {/* Icon */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.2))',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-xl)',
            fontSize: '2rem',
            animation: 'float 3s ease-in-out infinite',
          }}>
            📍
          </div>

          <h1 style={{ marginBottom: 'var(--space-lg)' }}>
            Share Your{' '}
            <span style={{
              background: 'var(--gradient-accent)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Live Location
            </span>
            <br />Instantly
          </h1>

          <p style={{ fontSize: '1.125rem', maxWidth: '480px', margin: '0 auto var(--space-2xl)' }}>
            Generate a private tracking link. Share it with anyone.
            They'll see exactly where you are in real time — no app required.
          </p>

          {/* CTA Button */}
          {!session && (
            <button
              id="create-session-btn"
              className="btn btn-primary btn-lg"
              onClick={handleCreateSession}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                  Creating session...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Create Tracking Session
                </>
              )}
            </button>
          )}

          {error && (
            <div className="toast toast-error" style={{ position: 'relative', bottom: 'auto', right: 'auto', marginTop: 'var(--space-lg)', display: 'inline-flex' }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Session Cards */}
        {session && (
          <div
            className="glass-card animate-fadeInUp"
            style={{
              width: '100%',
              maxWidth: '680px',
              padding: 'var(--space-2xl)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 'var(--radius-full)', padding: '0.375rem 1rem',
                color: '#34d399', fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-md)',
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
                Session Created!
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--color-accent-3)', fontFamily: 'monospace' }}>
                {session.trackingId}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
              {/* Share URL (Sender) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>📤</div>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Your Sender Link</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>(Open this to share location)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <div className="url-share-box" style={{ flex: 1 }}>{session.shareUrl}</div>
                  <CopyButton text={session.shareUrl} label="Copy" id="copy-share-url" />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 'var(--space-sm)', width: '100%' }}
                  onClick={() => navigate(`/share/${session.trackingId}`)}
                  id="open-sender-btn"
                >
                  Open Sender Page →
                </button>
              </div>

              <div className="divider" style={{ margin: '0' }} />

              {/* View URL (Viewer) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>👁</div>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Viewer Link</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>(Share this with others to track you)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                  <div className="url-share-box" style={{ flex: 1 }}>{session.viewUrl}</div>
                  <CopyButton text={session.viewUrl} label="Copy" id="copy-view-url" />
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ marginTop: 'var(--space-sm)', width: '100%' }}
                  onClick={() => window.open(`/track/${session.trackingId}`, '_blank')}
                  id="open-viewer-btn"
                >
                  Preview Viewer Page ↗
                </button>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setSession(null); }}
                id="create-another-btn"
                style={{ fontSize: '0.875rem' }}
              >
                + Create Another Session
              </button>
            </div>
          </div>
        )}

        {/* Feature pills */}
        {!session && (
          <div
            className="animate-fadeInUp"
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)',
              justifyContent: 'center', animationDelay: '0.2s', opacity: 0,
              animation: 'fadeInUp 0.5s ease 0.2s forwards',
            }}
          >
            {[
              { icon: '⚡', text: 'Under 2s updates' },
              { icon: '🗺️', text: 'OpenStreetMap' },
              { icon: '🔒', text: 'Private links' },
              { icon: '👥', text: 'Multi-viewer' },
              { icon: '📱', text: 'Mobile-friendly' },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '0.4rem 0.875rem',
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span>{f.icon}</span> {f.text}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: 'var(--space-lg)', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
        LiveTrack — Real-Time Location Sharing • Built with Spring Boot & React
      </footer>
    </div>
  );
}
