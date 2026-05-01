import { useId } from 'react';

interface Props {
  /** Size in pixels (width = height). Default 32. */
  size?: number;
  /**
   * When true, renders the M inside a rounded-square container,
   * matching the app-icon style from the brand guide.
   * Dark mode = dark background (icon 1), Light mode = white background (icon 2).
   */
  withContainer?: boolean;
  className?: string;
}

/**
 * Movr brand logo — the stylised M with play-button left leg and red dot.
 * The M uses an indigo gradient; the dot is rose/red.
 * Gradient IDs are scoped per-instance via useId() to avoid SVG conflicts.
 */
export default function MovrLogo({ size = 32, withContainer = false, className = '' }: Props) {
  const uid = useId().replace(/:/g, '');
  const gradId = `movr-g-${uid}`;
  const bgGradId = `movr-bg-${uid}`;

  /*
   * M path (viewBox 0 0 100 100):
   *   Outer boundary (clockwise):
   *     TL-outer → BL-outer → valley-outer → BR-outer → TR-outer
   *   Inner boundary (counter-clockwise, creating the filled letter shape):
   *     TR-inner → valley-inner → play-tip → TL-inner
   *
   *   The "play-tip" at (36, 35) creates the triangular notch on the
   *   inner-right edge of the left stroke, giving the ▶ play-button effect.
   */
  const mPath = 'M 10,10 L 10,70 L 50,53 L 90,70 L 90,10 L 77,10 L 50,43 L 36,35 L 23,10 Z';

  if (withContainer) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Movr"
      >
        <defs>
          {/* Dark bg gradient (dark theme / icon 1) */}
          <linearGradient id={bgGradId} x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          {/* M gradient */}
          <linearGradient id={gradId} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>
          <style>{`
            .movr-bg-${uid} { fill: url(#${bgGradId}) }
            @media (prefers-color-scheme: light) { .movr-bg-${uid} { fill: #ffffff } }
          `}</style>
        </defs>
        {/* Container background */}
        <rect width="100" height="100" rx="22" className={`movr-bg-${uid}`} />
        {/* M */}
        <path d={mPath} fill={`url(#${gradId})`} />
        {/* Red dot */}
        <circle cx="83" cy="83" r="8" fill="#EF4444" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Movr"
    >
      <defs>
        <linearGradient id={gradId} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <path d={mPath} fill={`url(#${gradId})`} />
      <circle cx="83" cy="83" r="8" fill="#EF4444" />
    </svg>
  );
}
