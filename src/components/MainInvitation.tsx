import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WEDDING_CONFIG } from '../config/weddingConfig';
import { AwanLaratCorner, MalayPalaceCrown, RoyalDivider } from './RoyalOrnaments';
import jasmineRoseGarland from '../assets/images/jasmine_rose_garland_1794719929434.jpg';

/**
 * Empty Ornate Antique-Gold Portrait Frame (Reserved for Couple Portrait Later)
 * Contains ZERO people or stock images by design.
 */
const OrnatePortraitFrame: React.FC = () => {
  const [imgError, setImgError] = useState(false);
  const hasPhoto = Boolean(WEDDING_CONFIG.couple.couplePortraitUrl?.trim()) && !imgError;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 26 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.95, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-[265px] sm:max-w-[300px]"
    >
      {/* Outer Antique Gold Carved Frame */}
      <div className="relative p-3 sm:p-3.5 rounded-t-[140px] rounded-b-2xl bg-gradient-to-b from-[#F4E2B8] via-[#C6A15B] to-[#8E6D31] shadow-[0_20px_50px_rgba(3,43,32,0.3)]">
        {/* Inner Deep Emerald Bevel */}
        <div className="relative p-2 rounded-t-[128px] rounded-b-xl bg-[#064E3B]">
          {/* Gold Hairline Inner Filigree */}
          <div className="relative aspect-[3/4] w-full rounded-t-[118px] rounded-b-lg border border-[#C6A15B]/80 overflow-hidden bg-songket-ivory flex flex-col items-center justify-center">
            {hasPhoto ? (
              <img
                src={WEDDING_CONFIG.couple.couplePortraitUrl}
                alt={WEDDING_CONFIG.couple.couplePortraitAlt}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              /* EMPTY ORNATE GOLD PORTRAIT FRAME PLACEHOLDER (NO PEOPLE / NO PHOTOS) */
              <div className="relative h-full w-full flex flex-col items-center justify-center px-6 py-8 text-center">
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 45%, rgba(250,247,240,0.92) 0%, rgba(245,240,229,0.78) 65%, rgba(198,161,91,0.18) 100%)',
                  }}
                />

                {/* Corner Awan Larat inside Frame */}
                <AwanLaratCorner
                  position="bl"
                  className="absolute bottom-2 left-2 w-10 h-10 text-[#C6A15B]/80"
                />
                <AwanLaratCorner
                  position="br"
                  className="absolute bottom-2 right-2 w-10 h-10 text-[#C6A15B]/80"
                />

                <div className="relative z-10 flex flex-col items-center">
                  <MalayPalaceCrown className="w-28 h-9 text-[#C6A15B] mb-3" />

                  {/* Reserved Z&P Crest Medallion */}
                  <div className="w-24 h-24 rounded-full border border-[#C6A15B]/85 bg-[#04392B] shadow-inner flex flex-col items-center justify-center mb-4 relative overflow-hidden">
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E6CB8E]/25 to-transparent animate-royal-sheen"
                    />
                    <span className="relative z-10 font-heading text-2xl font-bold text-gold-glow tracking-wider">
                      {WEDDING_CONFIG.couple.monogram}
                    </span>
                  </div>

                  <p className="font-heading text-base font-semibold text-[#064E3B] tracking-wide">
                    Ruangan Potret Pengantin
                  </p>
                  <p className="mt-1.5 font-body text-xs leading-relaxed text-[#16261F]/70 max-w-[195px]">
                    Bingkai emas antik disediakan khas untuk gambar rasmi mempelai kelak
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ornamental Crown Finial on Top of Arch */}
        <div
          aria-hidden="true"
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#F4E2B8] to-[#8E6D31] border-2 border-[#064E3B] shadow-md flex items-center justify-center"
        >
          <span className="w-2.5 h-2.5 rotate-45 bg-[#064E3B] block" />
        </div>
      </div>
    </motion.div>
  );
};

export const MainInvitation: React.FC = () => {
  const [garlandError, setGarlandError] = useState(false);

  return (
    <section
      id="jemputan"
      aria-label="Jemputan Utama Majlis Walimatulurus"
      className="relative w-full pt-4 sm:pt-8 pb-10 sm:pb-14 px-3 sm:px-6 overflow-hidden"
    >
      {/* Main Warm Ivory Royal Manuscript Card */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl rounded-3xl bg-songket-ivory border border-[#C6A15B]/80 shadow-[0_24px_70px_rgba(3,43,32,0.45)] overflow-hidden"
      >
        {/* Gold Light Sweep across Card on Entrance */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
        >
          <div
            className="absolute inset-y-0 w-1/3 animate-gold-sweep"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(230,203,142,0.3) 50%, transparent 100%)',
            }}
          />
        </div>

        {/* Inner Double Antique Gold Border */}
        <div className="pointer-events-none absolute inset-2.5 sm:inset-4 rounded-[20px] border border-[#C6A15B]/55 z-10" />
        <div className="pointer-events-none absolute inset-4 sm:inset-6 rounded-2xl border border-[#C6A15B]/25 z-10" />

        {/* Corner Malay Awan Larat Motifs */}
        <AwanLaratCorner
          position="tl"
          className="absolute top-3 left-3 sm:top-5 sm:left-5 w-12 h-12 sm:w-16 sm:h-16 text-[#C6A15B] z-10"
        />
        <AwanLaratCorner
          position="tr"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 w-12 h-12 sm:w-16 sm:h-16 text-[#C6A15B] z-10"
        />
        <AwanLaratCorner
          position="bl"
          className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 w-12 h-12 sm:w-16 sm:h-16 text-[#C6A15B] z-10"
        />
        <AwanLaratCorner
          position="br"
          className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 w-12 h-12 sm:w-16 sm:h-16 text-[#C6A15B] z-10"
        />

        {/* Top Botanical Jasmine & Rose Garland Banner */}
        <div className="relative w-full h-36 sm:h-52 md:h-60 overflow-hidden animate-botanical-sway">
          {!garlandError ? (
            <img
              src={jasmineRoseGarland}
              alt="Hiasan bunga melur dan mawar putih diraja"
              referrerPolicy="no-referrer"
              onError={() => setGarlandError(true)}
              className="w-full h-full object-cover object-center opacity-90"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-[#EAE2D0] to-[#F5F0E5] flex items-center justify-center">
              <MalayPalaceCrown className="w-44 h-14 text-[#C6A15B]" />
            </div>
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5F0E5]/30 to-[#F5F0E5]"
          />
        </div>

        {/* Main Content Grid: Single Column Mobile, 2-Column Editorial Palace on Desktop */}
        <div className="relative z-10 px-4 sm:px-10 md:px-12 pb-12 sm:pb-16 -mt-6 sm:-mt-10 grid grid-cols-1 lg:grid-cols-12 gap-9 lg:gap-10 items-center">
          {/* Left / Top Invitation Typography & Glowing Gold Couple Full Names */}
          <div className="lg:col-span-7 flex flex-col items-center text-center">
            {/* Islamic Opening */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="flex flex-col items-center"
            >
              <p
                lang="ar"
                dir="rtl"
                className="text-2xl sm:text-3xl text-[#064E3B] leading-relaxed"
                style={{ fontFamily: 'var(--font-arabic)' }}
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <p className="mt-2 font-body text-xs sm:text-sm font-medium tracking-wide text-[#16261F]/85">
                Assalamu&apos;alaikum Warahmatullahi Wabarakatuh
              </p>
            </motion.div>

            <RoyalDivider className="my-5 sm:my-6" />

            {/* Formal Event Title (Bodoni Moda) + Decorative Script Flourish (Great Vibes) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.25 }}
              className="flex flex-col items-center"
            >
              <p className="font-script text-2xl sm:text-3xl text-[#8E6D31] leading-none">
                Jemputan
              </p>
              <p className="mt-1.5 font-heading text-sm sm:text-base font-bold uppercase tracking-[0.24em] text-[#064E3B]">
                {WEDDING_CONFIG.event.title}
              </p>
            </motion.div>

            {/* Z&P Monogram Seal Reveal + Deep Emerald Plaque Holding Luminous Antique-Gold Couple Names */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 w-full rounded-2xl bg-songket-emerald border border-[#C6A15B]/85 shadow-[0_18px_45px_rgba(3,43,32,0.32)] px-4 sm:px-7 py-7 sm:py-8 relative overflow-hidden"
            >
              <div className="pointer-events-none absolute inset-2 rounded-xl border border-[#C6A15B]/35" />

              {/* Animated Z&P Royal Crest */}
              <motion.div
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-[#E6CB8E]/80 bg-[#032B20] shadow-[0_0_24px_rgba(198,161,91,0.35)] flex items-center justify-center overflow-hidden"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E6CB8E]/25 to-transparent animate-royal-sheen"
                />
                <span className="relative z-10 font-heading text-xl sm:text-2xl font-bold tracking-wider text-gold-glow">
                  {WEDDING_CONFIG.couple.monogram}
                </span>
              </motion.div>

              {/* Couple Full Names in Cormorant Garamond, Antique Gold with Subtle Glow */}
              <div className="relative z-10 w-full space-y-3 sm:space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 18, letterSpacing: '0.01em' }}
                  animate={{ opacity: 1, y: 0, letterSpacing: '0.04em' }}
                  transition={{ duration: 0.95, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
                  className="font-names font-bold text-gold-glow leading-[1.2] text-[clamp(1.25rem,4.7vw,2.1rem)] text-balance"
                >
                  {WEDDING_CONFIG.couple.groomFullName}
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.65, delay: 0.6 }}
                  className="flex items-center justify-center gap-3 py-0.5"
                >
                  <span className="h-[1px] w-10 bg-[#C6A15B]/70" />
                  <span className="font-script text-2xl sm:text-3xl text-[#E6CB8E]">
                    &amp;
                  </span>
                  <span className="h-[1px] w-10 bg-[#C6A15B]/70" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 18, letterSpacing: '0.01em' }}
                  animate={{ opacity: 1, y: 0, letterSpacing: '0.04em' }}
                  transition={{ duration: 0.95, delay: 0.66, ease: [0.16, 1, 0.3, 1] }}
                  className="font-names font-bold text-gold-glow leading-[1.2] text-[clamp(1.25rem,4.7vw,2.1rem)] text-balance"
                >
                  {WEDDING_CONFIG.couple.brideFullName}
                </motion.h2>
              </div>
            </motion.div>

            {/* Date & Venue Concise Unboxed Summary (Montserrat) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 font-body text-xs sm:text-sm font-medium text-[#16261F]/85"
            >
              <span>{WEDDING_CONFIG.event.dateDisplayMs}</span>
              <span aria-hidden="true" className="text-[#C6A15B]">·</span>
              <span>{WEDDING_CONFIG.event.timeDisplayMs}</span>
              <span aria-hidden="true" className="text-[#C6A15B]">·</span>
              <span className="font-semibold text-[#064E3B]">{WEDDING_CONFIG.event.venueName}</span>
            </motion.div>
          </div>

          {/* Right / Bottom Empty Ornate Gold Portrait Frame */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <OrnatePortraitFrame />
          </div>
        </div>
      </motion.div>
    </section>
  );
};
