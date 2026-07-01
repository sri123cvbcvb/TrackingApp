import React, { useState, useCallback } from 'react';

/**
 * Copy-to-clipboard button with visual feedback.
 */
export default function CopyButton({ text, label = 'Copy', id }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      id={id || `copy-btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`btn ${copied ? 'btn-secondary' : 'btn-secondary'}`}
      onClick={handleCopy}
      title={`Copy ${label}`}
      style={{
        padding: '0.4rem 0.875rem',
        fontSize: '0.8125rem',
        borderRadius: 'var(--radius-md)',
        minWidth: '72px',
        transition: 'all 0.2s ease',
        background: copied
          ? 'rgba(16, 185, 129, 0.15)'
          : undefined,
        borderColor: copied
          ? 'rgba(16, 185, 129, 0.4)'
          : undefined,
        color: copied ? '#34d399' : undefined,
      }}
    >
      {copied ? (
        <>✓ Copied!</>
      ) : (
        <>{/* clipboard icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
