import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'TeleEye — Telegram Message Viewer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          display: 'flex',
        }}
      />

      {/* Glow orbs */}
      <div
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
          display: 'flex',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -120,
          right: -80,
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          display: 'flex',
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: 26,
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          boxShadow: '0 0 60px rgba(99,102,241,0.5)',
        }}
      >
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
            fill="rgba(255,255,255,0.15)"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3.5" fill="white" opacity="0.95" />
          <circle cx="12" cy="12" r="1.8" fill="#2563eb" />
          <circle cx="13.2" cy="10.8" r="0.7" fill="white" opacity="0.9" />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 80,
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-2px',
          marginBottom: 16,
          display: 'flex',
        }}
      >
        TeleEye
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 28,
          color: 'rgba(165,180,252,0.85)',
          fontWeight: 400,
          letterSpacing: '0.02em',
          display: 'flex',
        }}
      >
        Telegram Message Viewer & Bot Manager
      </div>

      {/* Feature pills */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 48,
        }}
      >
        {['📨 Messages', '🤖 Bots', '🔔 Webhooks', '🌙 Dark Mode'].map((label) => (
          <div
            key={label}
            style={{
              padding: '10px 22px',
              borderRadius: 100,
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              color: 'rgba(199,210,254,0.9)',
              fontSize: 20,
              fontWeight: 500,
              display: 'flex',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
