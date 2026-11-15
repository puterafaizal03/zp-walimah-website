import React, { useId } from 'react';

interface OrnamentProps {
  className?: string;
}

/**
 * Bespoke Intertwined Royal "ZP" Monogram Crest
 * High-contrast serif "Z" interwoven with a sweeping calligraphic "P"
 * rendered in metallic antique gold with transparent weave cutouts.
 */
export const MonogramZP: React.FC<OrnamentProps & { label?: string }> = ({
  className = '',
  label,
}) => {
  const uid = useId().replace(/:/g, '');
  const goldGradId = `zp-gold-${uid}`;
  const lowerClipId = `zp-lower-clip-${uid}`;
  const maskZId = `zp-mask-z-${uid}`;
  const maskBowlId = `zp-mask-bowl-${uid}`;
  const maskStemId = `zp-mask-stem-${uid}`;

  // High-contrast Didone/Bodoni serif "Z" centered on 200x200 canvas
  const zPath =
    'M 86 66 L 139 66 L 94 143 L 114 143 C 130 143 139 136 143 122 L 137 148 L 74 148 L 121 70 L 106 70 C 90 70 82 78 78 92 Z';

  // Sweeping calligraphic "P" upper bowl arching over the Z and tucking behind Z's diagonal
  const pBowlPath =
    'M 66 91 C 59 75 62 53 95 48 C 122 44 142 63 141 85 C 140 102 124 109 106 102';

  // Sweeping calligraphic "P" stem + lower-left swash loop
  const pStemSwashPath =
    'M 168 59 C 159 43 139 43 123 66 C 113 80 99 107 83 129 C 69 148 50 156 36 141 C 23 128 30 105 52 102 C 69 100 86 104 98 100';

  return (
    <svg
      viewBox="16 32 164 134"
      fill="none"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`select-none drop-shadow-[0_2px_6px_rgba(2,29,21,0.55)] ${className}`}
    >
      <defs>
        <linearGradient id={goldGradId} x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#FFF0C4" />
          <stop offset="32%" stopColor="#E6CB8E" />
          <stop offset="68%" stopColor="#C6A15B" />
          <stop offset="100%" stopColor="#9A7432" />
        </linearGradient>

        {/* Restrict Z knockout on P strokes to below y=80 so P passes cleanly OVER Z's top bar */}
        <clipPath id={lowerClipId}>
          <rect x="60" y="80" width="100" height="80" />
        </clipPath>

        {/* Mask for Z: cut gaps where P's upper bowl and upper stem weave in front */}
        <mask id={maskZId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="200" height="200" fill="white" />
          <path
            d="M 66 91 C 59 75 62 53 95 48 C 122 44 142 63 141 85"
            stroke="black"
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <path
            d="M 168 59 C 159 43 139 43 114 79"
            stroke="black"
            strokeWidth="8.5"
            strokeLinecap="round"
          />
        </mask>

        {/* Mask for P's upper bowl: stem passes in front near top-right; Z diagonal passes in front below y=80 */}
        <mask id={maskBowlId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="200" height="200" fill="white" />
          <path
            d="M 168 59 C 159 43 139 43 114 79"
            stroke="black"
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <g clipPath={`url(#${lowerClipId})`}>
            <path d={zPath} fill="black" stroke="black" strokeWidth="5.5" strokeLinejoin="round" />
          </g>
        </mask>

        {/* Mask for P's stem & swash: Z diagonal passes in front below y=80 */}
        <mask id={maskStemId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="200" height="200" fill="white" />
          <g clipPath={`url(#${lowerClipId})`}>
            <path d={zPath} fill="black" stroke="black" strokeWidth="5.5" strokeLinejoin="round" />
          </g>
        </mask>
      </defs>

      {/* Center Bold Serif Z */}
      <path d={zPath} fill={`url(#${goldGradId})`} mask={`url(#${maskZId})`} />

      {/* Calligraphic P Upper Bowl */}
      <path
        d={pBowlPath}
        stroke={`url(#${goldGradId})`}
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        mask={`url(#${maskBowlId})`}
      />

      {/* Calligraphic P Stem & Lower-Left Swash */}
      <path
        d={pStemSwashPath}
        stroke={`url(#${goldGradId})`}
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        mask={`url(#${maskStemId})`}
      />
    </svg>
  );
};

/**
 * Traditional Malay Awan Larat Corner Filigree SVG
 */
export const AwanLaratCorner: React.FC<OrnamentProps & { position?: 'tl' | 'tr' | 'bl' | 'br' }> = ({
  className = '',
  position = 'tl',
}) => {
  const rotationMap = {
    tl: '',
    tr: 'scale-x-[-1]',
    bl: 'scale-y-[-1]',
    br: 'scale-[-1]',
  };

  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none select-none ${rotationMap[position]} ${className}`}
    >
      <path
        d="M4 92V20C4 11.1634 11.1634 4 20 4H92"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeOpacity="0.8"
      />
      <path
        d="M11 86V22C11 15.9249 15.9249 11 22 11H86"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeOpacity="0.55"
      />
      {/* Malay Awan Larat Scrollwork */}
      <path
        d="M18 52C18 40 24 31 35 28C41 26.5 47 29 47 34C47 38.5 43 41 39 40C35.5 39 34 35.5 36.5 33"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M52 18C40 18 31 24 28 35C26.5 41 29 47 34 47C38.5 47 41 43 40 39C39 35.5 35.5 34 33 36.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      {/* Corner Jasmine / Bunga Tanjung Motif */}
      <circle cx="20" cy="20" r="3" fill="currentColor" fillOpacity="0.85" />
      <path
        d="M20 12C21.8 15 21.8 17 20 20C18.2 17 18.2 15 20 12ZM28 20C25 21.8 23 21.8 20 20C23 18.2 25 18.2 28 20ZM20 28C18.2 25 18.2 23 20 20C21.8 23 21.8 25 20 28ZM12 20C15 18.2 17 18.2 20 20C17 21.8 15 21.8 12 20Z"
        fill="currentColor"
        fillOpacity="0.45"
      />
      <circle cx="62" cy="11" r="1.5" fill="currentColor" fillOpacity="0.65" />
      <circle cx="11" cy="62" r="1.5" fill="currentColor" fillOpacity="0.65" />
    </svg>
  );
};

/**
 * Symmetrical Royal Malay Palace Crest & Jasmine Divider
 */
export const RoyalDivider: React.FC<OrnamentProps> = ({ className = '' }) => (
  <div className={`flex items-center justify-center gap-3 w-full max-w-xs mx-auto ${className}`} aria-hidden="true">
    <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C6A15B]/70 to-[#C6A15B]" />
    <svg viewBox="0 0 64 28" className="w-14 h-6 text-[#C6A15B] shrink-0" fill="none">
      {/* Central Diamond Songket Star */}
      <path
        d="M32 3L37 14L32 25L27 14L32 3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="currentColor"
        fillOpacity="0.18"
      />
      <path
        d="M20 14L32 9L44 14L32 19L20 14Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="32" cy="14" r="2.2" fill="currentColor" />
      {/* Flanking Awan Larat Leaves */}
      <path
        d="M18 14C13 10 8 11 4 14C8 17 13 18 18 14Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M46 14C51 10 56 11 60 14C56 17 51 18 46 14Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
    <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C6A15B]/70 to-[#C6A15B]" />
  </div>
);

/**
 * Traditional Malay Royal Palace Pucuk Rebung Crown Crest
 */
export const MalayPalaceCrown: React.FC<OrnamentProps> = ({ className = '' }) => (
  <svg
    viewBox="0 0 180 56"
    fill="none"
    aria-hidden="true"
    className={`pointer-events-none select-none ${className}`}
  >
    {/* Central Palace Spire (Kubah / Pucuk Rebung) */}
    <path
      d="M90 6C94 14 102 18 106 28C109 35 104 42 90 44C76 42 71 35 74 28C78 18 86 14 90 6Z"
      stroke="currentColor"
      strokeWidth="1.3"
      fill="currentColor"
      fillOpacity="0.12"
    />
    <path
      d="M90 12C92.5 18 97 22 99 29C100.5 34 97 38 90 39.5C83 38 79.5 34 81 29C83 22 87.5 18 90 12Z"
      stroke="currentColor"
      strokeWidth="0.9"
    />
    {/* Jasmine Petals inside Crest */}
    <circle cx="90" cy="27" r="2.5" fill="currentColor" />
    <path
      d="M90 20C91.5 23 91.5 25 90 27C88.5 25 88.5 23 90 20ZM97 27C94 28.5 92 28.5 90 27C92 25.5 94 25.5 97 27ZM90 34C88.5 31 88.5 29 90 27C91.5 29 91.5 31 90 34ZM83 27C86 25.5 88 25.5 90 27C88 28.5 86 28.5 83 27Z"
      fill="currentColor"
      fillOpacity="0.6"
    />
    {/* Left & Right Awan Larat Wings */}
    <path
      d="M72 34C61 32 52 24 41 25C32 26 28 33 34 38C39 42 46 39 45 34C44 31 40 30 38 32"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M108 34C119 32 128 24 139 25C148 26 152 33 146 38C141 42 134 39 135 34C136 31 140 30 142 32"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path d="M12 44H74M106 44H168" stroke="currentColor" strokeWidth="0.9" strokeOpacity="0.65" />
    <circle cx="24" cy="44" r="2" fill="currentColor" fillOpacity="0.7" />
    <circle cx="156" cy="44" r="2" fill="currentColor" fillOpacity="0.7" />
  </svg>
);

interface FloatingParticlesProps {
  variant?: 'emerald' | 'ivory';
  dense?: boolean;
}

const PETALS = [
  { left: '8%', delay: '0s', duration: '12s', drift: '28px', size: 15, type: 'jasmine' },
  { left: '22%', delay: '2.5s', duration: '14.5s', drift: '-24px', size: 13, type: 'rose' },
  { left: '37%', delay: '5s', duration: '11.5s', drift: '32px', size: 14, type: 'jasmine' },
  { left: '54%', delay: '1.2s', duration: '15s', drift: '-30px', size: 12, type: 'gold-leaf' },
  { left: '68%', delay: '3.8s', duration: '13s', drift: '22px', size: 15, type: 'jasmine' },
  { left: '82%', delay: '6.2s', duration: '12.5s', drift: '-26px', size: 13, type: 'rose' },
  { left: '92%', delay: '4.1s', duration: '14s', drift: '-18px', size: 12, type: 'jasmine' },
];

const SPARKLES = [
  { left: '14%', top: '18%', delay: '0.2s', duration: '3.8s', size: 5 },
  { left: '85%', top: '22%', delay: '1.4s', duration: '4.2s', size: 6 },
  { left: '28%', top: '65%', delay: '0.8s', duration: '3.5s', size: 4 },
  { left: '74%', top: '58%', delay: '2.1s', duration: '4.6s', size: 5 },
  { left: '50%', top: '14%', delay: '1.7s', duration: '4.0s', size: 4 },
  { left: '19%', top: '82%', delay: '2.8s', duration: '3.9s', size: 5 },
  { left: '81%', top: '84%', delay: '0.5s', duration: '4.4s', size: 4 },
];

/**
 * Lightweight GPU-composited floating floral petals (jasmine & ivory rose) and gold sparkles
 */
export const FloatingPetalsAndSparkles: React.FC<FloatingParticlesProps> = ({
  variant = 'emerald',
  dense = false,
}) => {
  const activePetals = dense ? PETALS : PETALS.slice(0, 5);
  const petalFill = variant === 'emerald' ? '#FAF7F0' : '#FFFFFF';
  const roseFill = variant === 'emerald' ? '#F3DFC1' : '#E9D3AD';

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-10" aria-hidden="true">
      {activePetals.map((petal, idx) => (
        <div
          key={`petal-${idx}`}
          className="absolute -top-8 animate-petal-drift"
          style={
            {
              left: petal.left,
              '--petal-delay': petal.delay,
              '--petal-duration': petal.duration,
              '--drift-x': petal.drift,
            } as React.CSSProperties
          }
        >
          {petal.type === 'jasmine' ? (
            <svg width={petal.size} height={petal.size} viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C13.6 6.2 13.6 9 12 12C10.4 9 10.4 6.2 12 2ZM22 12C17.8 13.6 15 13.6 12 12C15 10.4 17.8 10.4 22 12ZM12 22C10.4 17.8 10.4 15 12 12C13.6 15 13.6 17.8 12 22ZM2 12C6.2 10.4 9 10.4 12 12C9 13.6 6.2 13.6 2 12Z"
                fill={petalFill}
                fillOpacity="0.82"
              />
              <circle cx="12" cy="12" r="1.6" fill="#C6A15B" />
            </svg>
          ) : petal.type === 'rose' ? (
            <svg width={petal.size} height={petal.size} viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2C14.5 2.8 17 6.8 15.8 11.4C14.8 15.2 11.5 17.5 8 17C4.5 16.5 2.5 12.6 4 8.5C5.2 5.2 7.5 2.5 10 2Z"
                fill={roseFill}
                fillOpacity="0.72"
              />
            </svg>
          ) : (
            <svg width={petal.size} height={petal.size} viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2C13 6 14 11 10 18C6 11 7 6 10 2Z"
                fill="#C6A15B"
                fillOpacity="0.55"
              />
            </svg>
          )}
        </div>
      ))}

      {SPARKLES.map((sparkle, idx) => (
        <div
          key={`sparkle-${idx}`}
          className="absolute animate-gold-sparkle"
          style={
            {
              left: sparkle.left,
              top: sparkle.top,
              '--sparkle-delay': sparkle.delay,
              '--sparkle-duration': sparkle.duration,
            } as React.CSSProperties
          }
        >
          <span
            className="block rounded-full bg-[#E6CB8E] shadow-[0_0_10px_2px_rgba(198,161,91,0.55)]"
            style={{ width: sparkle.size, height: sparkle.size }}
          />
        </div>
      ))}
    </div>
  );
};
