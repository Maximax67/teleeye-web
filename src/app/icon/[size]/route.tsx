import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ size: '32' }, { size: '192' }, { size: '512' }];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ size: string }> | { size: string } },
) {
  const resolvedParams = await params;
  const size = parseInt(resolvedParams.size, 10);
  const resolvedSize = [32, 192, 512].includes(size) ? size : 32;

  return new ImageResponse(
    <div
      style={{
        width: resolvedSize,
        height: resolvedSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)',
        borderRadius: resolvedSize * 0.22,
      }}
    >
      {/* Eye shape */}
      <svg width={resolvedSize * 0.72} height={resolvedSize * 0.72} viewBox="0 0 24 24" fill="none">
        {/* Outer eye */}
        <path
          d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z"
          fill="rgba(255,255,255,0.15)"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Iris */}
        <circle cx="12" cy="12" r="3.5" fill="white" opacity="0.95" />
        {/* Pupil */}
        <circle cx="12" cy="12" r="1.8" fill="#1d4ed8" />
        {/* Shine */}
        <circle cx="13.2" cy="10.8" r="0.7" fill="white" opacity="0.9" />
      </svg>
    </div>,
    {
      width: resolvedSize,
      height: resolvedSize,
    },
  );
}
