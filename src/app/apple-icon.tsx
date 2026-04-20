import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const contentType = 'image/png';
export const size = { width: 180, height: 180 };

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
        borderRadius: 40,
      }}
    >
      <svg width="130" height="130" viewBox="0 0 24 24" fill="none">
        <path
          d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
          fill="rgba(255,255,255,0.15)"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3.5" fill="white" opacity="0.95" />
        <circle cx="12" cy="12" r="1.8" fill="#1d4ed8" />
        <circle cx="13.2" cy="10.8" r="0.7" fill="white" opacity="0.9" />
      </svg>
    </div>,
    { width: 180, height: 180 },
  );
}
