import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WEDDING_CONFIG } from '../config/weddingConfig';
import {
  AwanLaratCorner,
  FloatingPetalsAndSparkles,
  MalayPalaceCrown,
  MonogramZP,
} from './RoyalOrnaments';
import emeraldSongketBg from '../assets/images/malay_songket_emerald_bg_1794719929264.jpg';

interface EnvelopeOpeningProps {
  onOpenStart?: () => void;
  onOpenComplete: () => void;
}

/**
 * Symmetrical Malay Jasmine & Botanical Sprig flanking the Z&P Monogram
 */
const SymmetricalFloralSprig: React.FC<{ mirrored?: boolean }> = ({ mirrored = false }) => (
  <svg
    viewBox="0 0 64 28"
    fill="none"
    aria-hidden="true"
    className={`w-12 sm:w-14 h-6 text-[#E6CB8E] ${mirrored ? 'scale-x-[-1]' : ''}`}
  >
    <path
      d="M60 14C48 14 38 11 26 14C16 16.5 8 15 3 13"
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.7"
      strokeLinecap="round"
    />
    {/* Jasmine Blossoms */}
    <circle cx="46" cy="12" r="2.2" fill="currentColor" />
    <path
      d="M46 6.5C47.2 9 47.2 10.5 46 12C44.8 10.5 44.8 9 46 6.5ZM51.5 12C49 13.2 47.5 13.2 46 12C47.5 10.8 49 10.8 51.5 12ZM46 17.5C44.8 15 44.8 13.5 46 12C47.2 13.5 47.2 15 46 17.5ZM40.5 12C43 10.8 44.5 10.8 46 12C44.5 13.2 43 13.2 40.5 12Z"
      fill="currentColor"
      fillOpacity="0.65"
    />
    {/* Botanical Leaves */}
    <path
      d="M32 13.5C28 7.5 22 6.5 18 9.5C22 12.5 28 13.5 32 13.5Z"
      fill="currentColor"
      fillOpacity="0.45"
    />
    <path
      d="M22 15C18 20.5 12 21.5 8 18.5C12 15.5 18 15 22 15Z"
      fill="currentColor"
      fillOpacity="0.45"
    />
    <circle cx="11" cy="13.5" r="1.5" fill="currentColor" fillOpacity="0.85" />
  </svg>
);

export const EnvelopeOpening: React.FC<EnvelopeOpeningProps> = ({
  onOpenStart,
  onOpenComplete,
}) => {
  const [stage, setStage] = useState<'closed' | 'opening' | 'sweep'>('closed');

  const handleOpenEnvelope = () => {
    if (stage !== 'closed') return;
    onOpenStart?.();
    setStage('opening');

    window.setTimeout(() => {
      setStage('sweep');
    }, 650);

    window.setTimeout(() => {
      onOpenComplete();
    }, 1550);
  };

  const isOpening = stage === 'opening' || stage === 'sweep';

  return (
    <motion.section
      aria-label="Pembukaan Kad Jemputan Majlis Walimatulurus"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } }}
      className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden bg-[#064E3B] px-4 pt-[calc(env(safe-area-inset-top,0px)+4.5rem)] pb-14 sm:py-14"
    >
      {/* Layer 1: Woven Songket Emerald Silk Texture with Deep Radial Scrim */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <img
          src={emeraldSongketBg}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover opacity-25 mix-blend-luminosity"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 44%, rgba(6, 78, 59, 0.52) 0%, rgba(3, 43, 32, 0.92) 72%, rgba(2, 29, 21, 0.98) 100%)',
          }}
        />
      </div>

      {/* Layer 2: Floating Jasmine Petals & Antique Gold Sparkles */}
      <FloatingPetalsAndSparkles variant="emerald" dense />

      {/* Layer 3: Full-Screen Antique Gold Ornamental Frame */}
      <div className="pointer-events-none fixed inset-2.5 sm:inset-5 border border-[#C6A15B]/35 rounded-2xl z-10">
        <div className="absolute inset-1.5 border border-[#C6A15B]/20 rounded-xl" />
        <AwanLaratCorner position="tl" className="absolute top-1.5 left-1.5 w-12 h-12 sm:w-16 sm:h-16 text-[#C6A15B]" />
        <AwanLaratCorner position="tr" className="absolute top-1.5 right-1.5 w-12 h-12 sm:w-16 sm:h-16 text-[#C6A15B]" />
        <AwanLaratCorner position="bl" className="absolute bottom-1.5 left-1.5 w-12 h-12 sm:w-16 sm:h-16 text-[#C6A15B]" />
        <AwanLaratCorner position="br" className="absolute bottom-1.5 right-1.5 w-12 h-12 sm:w-16 sm:h-16 text-[#C6A15B]" />
      </div>

      {/* Layer 4: Gold Light Sweep Overlay upon Opening */}
      <AnimatePresence>
        {stage === 'sweep' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
          >
            <div
              className="absolute inset-y-0 w-1/2 animate-gold-sweep"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(230,203,142,0.25) 35%, rgba(250,247,240,0.7) 50%, rgba(198,161,91,0.3) 65%, transparent 100%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 5: Central Royal Palace Header & 3D Envelope Stage */}
      <div className="relative z-20 w-full max-w-[380px] sm:max-w-[440px] flex flex-col items-center text-center">
        {/* Top Heading: DENGAN PENUH KESYUKURAN (Bodoni Moda) + Script Flourish (Great Vibes) */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 sm:mb-7 flex flex-col items-center"
        >
          <MalayPalaceCrown className="w-28 sm:w-32 h-9 text-[#C6A15B] mb-2" />
          <p className="font-heading text-xs sm:text-sm uppercase tracking-[0.24em] text-[#E6CB8E] font-semibold">
            {WEDDING_CONFIG.invitationCopy.gratitudeHeading}
          </p>
          <p className="mt-1 font-script text-2xl sm:text-3xl text-[#FAF7F0] tracking-normal">
            Walimatulurus
          </p>
        </motion.div>

        {/* Soft Glowing Halo Behind Envelope */}
        <div className="relative w-full flex items-center justify-center py-2">
          <div
            aria-hidden="true"
            className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-[#C6A15B]/20 blur-3xl animate-soft-aura"
          />

          {/* 3D Royal Envelope Container */}
          <div className="envelope-perspective relative w-full max-w-[330px] sm:max-w-[380px] aspect-[4/3]">
            {/* Rising Inner Ivory Invitation Letter */}
            <motion.div
              initial={false}
              animate={
                isOpening
                  ? { y: '-48%', scale: 1.03, opacity: 1 }
                  : { y: '2%', scale: 0.96, opacity: 0.92 }
              }
              transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-4 top-3 bottom-4 z-10 rounded-xl bg-[#F5F0E5] border border-[#C6A15B] shadow-[0_14px_40px_rgba(0,0,0,0.45)] flex flex-col items-center justify-center px-4 py-5 text-center overflow-hidden"
            >
              <div className="absolute inset-1.5 border border-[#C6A15B]/45 rounded-lg pointer-events-none" />
              <p className="font-heading text-[10px] uppercase tracking-[0.24em] text-[#8E6D31] font-semibold">
                {WEDDING_CONFIG.event.title}
              </p>
              <p className="mt-2 font-names text-lg sm:text-xl font-bold text-[#064E3B] leading-tight">
                Nur Zaireen Farisya
              </p>
              <span className="my-0.5 font-script text-lg text-[#C6A15B]">&amp;</span>
              <p className="font-names text-lg sm:text-xl font-bold text-[#064E3B] leading-tight">
                Putera Faizal Hakimi
              </p>
              <p className="mt-2.5 font-body text-[10px] tracking-[0.16em] text-[#064E3B]/80 uppercase font-medium">
                {WEDDING_CONFIG.event.dateDisplayMs}
              </p>
            </motion.div>

            {/* Envelope Back Inner Shadow */}
            <div className="absolute inset-0 z-0 rounded-2xl bg-[#032B20] border border-[#C6A15B]/60 shadow-[0_24px_60px_rgba(0,0,0,0.55)]" />

            {/* Envelope Front Pocket (Left, Right, Bottom Folds) */}
            <div className="absolute inset-0 z-20 rounded-2xl overflow-hidden pointer-events-none">
              <svg viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id="emeraldPocket" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#075A44" />
                    <stop offset="55%" stopColor="#054231" />
                    <stop offset="100%" stopColor="#032E22" />
                  </linearGradient>
                  <linearGradient id="goldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8E6D31" />
                    <stop offset="50%" stopColor="#E6CB8E" />
                    <stop offset="100%" stopColor="#C6A15B" />
                  </linearGradient>
                </defs>
                <polygon points="0,0 205,158 0,300" fill="#043A2C" />
                <polygon points="400,0 195,158 400,300" fill="#043A2C" />
                <polygon points="0,300 200,138 400,300" fill="url(#emeraldPocket)" />
                <polyline
                  points="0,300 200,138 400,300"
                  fill="none"
                  stroke="url(#goldTrim)"
                  strokeWidth="2.2"
                />
                <polyline
                  points="14,300 200,149 386,300"
                  fill="none"
                  stroke="#C6A15B"
                  strokeOpacity="0.4"
                  strokeWidth="1"
                />
              </svg>

              {/* Corner Awan Larat Accents on Pocket */}
              <AwanLaratCorner position="bl" className="absolute bottom-2 left-2 w-10 h-10 text-[#C6A15B]/80" />
              <AwanLaratCorner position="br" className="absolute bottom-2 right-2 w-10 h-10 text-[#C6A15B]/80" />
            </div>

            {/* 3D Animated Top Envelope Flap */}
            <div
              className={`envelope-flap absolute inset-x-0 top-0 h-[58%] z-30 pointer-events-none ${
                isOpening ? 'envelope-flap-open' : ''
              }`}
            >
              <svg viewBox="0 0 400 175" preserveAspectRatio="none" className="w-full h-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]">
                <defs>
                  <linearGradient id="flapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#086048" />
                    <stop offset="100%" stopColor="#043A2C" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,12 Q0,0 16,0 L384,0 Q400,0 400,12 L200,168 Z"
                  fill="url(#flapGrad)"
                />
                <path
                  d="M6,10 L200,162 L394,10"
                  fill="none"
                  stroke="#C6A15B"
                  strokeWidth="2"
                />
                <path
                  d="M22,8 L200,148 L378,8"
                  fill="none"
                  stroke="#E6CB8E"
                  strokeOpacity="0.4"
                  strokeWidth="0.9"
                />
              </svg>
            </div>

            {/* Front Envelope Centerpiece: Symmetrical Malay Floral Ornaments + Z&P Antique Gold Crest Seal */}
            <motion.div
              animate={
                isOpening
                  ? { scale: 1.25, opacity: 0 }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-1/2 top-[53%] -translate-x-1/2 -translate-y-1/2 z-40 flex items-center justify-center gap-2 sm:gap-3"
            >
              <div className="pointer-events-none animate-floral-float">
                <SymmetricalFloralSprig />
              </div>

              <button
                type="button"
                onClick={handleOpenEnvelope}
                disabled={isOpening}
                aria-label="Ketuk mohor ZP untuk membuka kad jemputan"
                className="relative w-[90px] h-[90px] sm:w-[98px] sm:h-[98px] rounded-full flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6CB8E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#064E3B] group shrink-0"
              >
                {/* Outer Antique Gold Scalloped Seal */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F4E2B8] via-[#C6A15B] to-[#8E6D31] shadow-[0_10px_28px_rgba(0,0,0,0.55),0_0_26px_rgba(198,161,91,0.5)] transition-transform duration-300 group-hover:scale-105 group-active:scale-95" />
                {/* Inner Deep Emerald Royal Medallion */}
                <span className="relative w-[76px] h-[76px] sm:w-[82px] sm:h-[82px] rounded-full bg-[#04392B] border border-[#E6CB8E]/85 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E6CB8E]/25 to-transparent animate-royal-sheen"
                  />
                  <MonogramZP className="relative z-10 w-[50px] h-[41px] sm:w-[56px] sm:h-[46px] -mt-0.5" />
                  <span className="relative z-10 mt-0.5 font-body text-[7.5px] sm:text-[8px] uppercase tracking-[0.2em] text-[#E6CB8E]/90 leading-none">
                    12 · 12 · 26
                  </span>
                </span>
              </button>

              <div className="pointer-events-none animate-floral-float">
                <SymmetricalFloralSprig mirrored />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Date Preview + Primary Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 sm:mt-9 flex flex-col items-center w-full"
        >
          <p className="font-body text-xs sm:text-sm text-[#F5F0E5]/90 tracking-[0.14em] uppercase mb-4">
            {WEDDING_CONFIG.event.dateDisplayMs} · Pasir Gudang, Johor
          </p>

          <button
            type="button"
            onClick={handleOpenEnvelope}
            disabled={isOpening}
            className="relative overflow-hidden min-h-[52px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#B89047] via-[#E2C27E] to-[#B89047] text-[#032B20] font-body font-bold text-sm sm:text-base tracking-[0.14em] uppercase shadow-[0_10px_30px_rgba(0,0,0,0.45),0_0_24px_rgba(198,161,91,0.35)] hover:brightness-105 active:scale-[0.98] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF7F0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#064E3B] disabled:opacity-75 whitespace-nowrap"
          >
            <span className="relative z-10">
              {isOpening ? 'MEMBUKA JEMPUTAN...' : 'BUKA KAD JEMPUTAN'}
            </span>
          </button>

          <p className="mt-3 font-body text-xs text-[#E6CB8E]/80">
            Ketuk mohor diraja atau tekan butang di atas untuk membuka jemputan
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
};
