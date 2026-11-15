import React from 'react';
import { motion } from 'motion/react';
import { WEDDING_CONFIG } from '../config/weddingConfig';
import { AwanLaratCorner, MalayPalaceCrown, RoyalDivider } from './RoyalOrnaments';

export const FamilyInvitation: React.FC = () => {
  return (
    <section
      id="keluarga"
      aria-label="Jemputan Pihak Keluarga"
      className="relative w-full py-6 sm:py-10 px-3 sm:px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl rounded-3xl bg-songket-emerald border border-[#C6A15B]/70 shadow-[0_24px_65px_rgba(2,29,21,0.55)] px-5 sm:px-12 py-12 sm:py-16 text-center overflow-hidden"
      >
        {/* Inner Ornamental Hairline */}
        <div className="pointer-events-none absolute inset-3 sm:inset-4 rounded-2xl border border-[#C6A15B]/30" />

        {/* Malay Awan Larat Corners */}
        <AwanLaratCorner position="tl" className="absolute top-3.5 left-3.5 w-11 h-11 sm:w-14 sm:h-14 text-[#C6A15B]/80" />
        <AwanLaratCorner position="tr" className="absolute top-3.5 right-3.5 w-11 h-11 sm:w-14 sm:h-14 text-[#C6A15B]/80" />
        <AwanLaratCorner position="bl" className="absolute bottom-3.5 left-3.5 w-11 h-11 sm:w-14 sm:h-14 text-[#C6A15B]/80" />
        <AwanLaratCorner position="br" className="absolute bottom-3.5 right-3.5 w-11 h-11 sm:w-14 sm:h-14 text-[#C6A15B]/80" />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <MalayPalaceCrown className="w-28 h-9 text-[#C6A15B] mb-4" />

          {/* Formal Heading in Bodoni Moda */}
          <h2 className="font-heading text-sm sm:text-base uppercase tracking-[0.24em] text-[#E6CB8E] font-bold">
            {WEDDING_CONFIG.invitationCopy.gratitudeHeading}
          </h2>

          {/* Small Decorative Script Flourish in Great Vibes */}
          <p className="mt-2 font-script text-2xl sm:text-3xl text-[#FAF7F0]/95">
            Dengan segala hormat dan takzimnya
          </p>

          {/* 1. BRIDE'S PARENTS — HOST FAMILY (DISPLAY FIRST / ABOVE THE COUPLE) */}
          <p className="mt-6 font-body text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#C6A15B] font-semibold">
            Tuan Rumah · Majlis Belah Perempuan
          </p>

          <div className="mt-4 mb-8 w-full flex flex-col items-center space-y-2.5 sm:space-y-3 text-center">
            <h3 className="font-heading font-semibold text-gold-glow tracking-[0.03em] leading-snug text-[clamp(1rem,3.8vw,1.6rem)]">
              {WEDDING_CONFIG.bridesParents.fatherName}
            </h3>
            <div className="flex items-center justify-center gap-3 py-0.5" aria-hidden="true">
              <span className="h-[1px] w-7 bg-[#C6A15B]/55" />
              <span className="font-script text-2xl sm:text-3xl text-[#C6A15B] leading-none">
                &amp;
              </span>
              <span className="h-[1px] w-7 bg-[#C6A15B]/55" />
            </div>
            <span className="sr-only">&amp;</span>
            <h3 className="font-heading font-semibold text-gold-glow tracking-[0.03em] leading-snug text-[clamp(1rem,3.8vw,1.6rem)]">
              {WEDDING_CONFIG.bridesParents.motherName}
            </h3>
          </div>

          {/* Exact Supplied Invitation Wording (Montserrat) */}
          <p className="font-body text-sm sm:text-base leading-relaxed text-[#F5F0E5] max-w-xl text-balance">
            {WEDDING_CONFIG.invitationCopy.familyInvitationText}
          </p>

          <RoyalDivider className="my-9 sm:my-10" />

          {/* 2. BRIDE & 3. GROOM IN CORMORANT GARAMOND ANTIQUE GOLD */}
          <div className="space-y-3.5 text-center w-full">
            <div>
              <p className="font-names font-bold text-gold-glow tracking-[0.04em] leading-[1.2] text-[clamp(1.25rem,4.5vw,1.95rem)] text-balance">
                <span className="block">{WEDDING_CONFIG.couple.brideGivenName}</span>
                <span className="block text-[0.78em] tracking-[0.06em] mt-0.5 text-[#E6CB8E]/95">
                  {WEDDING_CONFIG.couple.brideParentage}
                </span>
              </p>
            </div>

            <p className="font-script text-2xl text-[#C6A15B] py-0.5">dengan pasangannya</p>

            <div>
              <p className="font-names font-bold text-gold-glow tracking-[0.04em] leading-[1.2] text-[clamp(1.25rem,4.5vw,1.95rem)] text-balance">
                <span className="block">{WEDDING_CONFIG.couple.groomGivenName}</span>
                <span className="block text-[0.78em] tracking-[0.06em] mt-0.5 text-[#E6CB8E]/95">
                  {WEDDING_CONFIG.couple.groomParentage}
                </span>
              </p>
            </div>
          </div>

          {/* 4. GROOM'S PARENTS (DISPLAY AFTER THE COUPLE WITH GENEROUS VERTICAL SEPARATION) */}
          <div className="mt-10 sm:mt-12 pt-8 sm:pt-9 border-t border-[#C6A15B]/30 w-full flex flex-col items-center text-center">
            <p className="font-body text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#C6A15B] font-semibold mb-4">
              Putera Kepada
            </p>
            <div className="w-full flex flex-col items-center space-y-2.5 sm:space-y-3">
              <p className="font-heading font-semibold text-gold-glow tracking-[0.03em] leading-snug text-[clamp(1rem,3.8vw,1.6rem)]">
                {WEDDING_CONFIG.groomsParents.fatherName}
              </p>
              <div className="flex items-center justify-center gap-3 py-0.5" aria-hidden="true">
                <span className="h-[1px] w-7 bg-[#C6A15B]/55" />
                <span className="font-script text-2xl sm:text-3xl text-[#C6A15B] leading-none">
                  &amp;
                </span>
                <span className="h-[1px] w-7 bg-[#C6A15B]/55" />
              </div>
              <span className="sr-only">&amp;</span>
              <p className="font-heading font-semibold text-gold-glow tracking-[0.03em] leading-snug text-[clamp(1rem,3.8vw,1.6rem)]">
                {WEDDING_CONFIG.groomsParents.motherName}
              </p>
            </div>
          </div>

          {/* Traditional Blessing Prayer */}
          <div className="mt-8 pt-6 border-t border-[#C6A15B]/25 max-w-lg">
            <p className="font-names italic text-base sm:text-lg text-[#E6CB8E]/90 leading-relaxed">
              &ldquo;Ya Allah, berkatilah majlis perkahwinan ini, limpahkanlah barakah dan rahmat ke atas kedua-dua mempelai serta himpunkanlah mereka dalam kebaikan dan kebahagiaan yang berkekalan.&rdquo;
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
