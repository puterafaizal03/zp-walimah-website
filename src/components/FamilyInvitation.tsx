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

          {/* Exact Bride's Parents Names */}
          <div className="mt-6 mb-6 space-y-1.5">
            <h3 className="font-heading font-bold text-gold-glow tracking-wide text-[clamp(1.25rem,4.5vw,1.95rem)] text-balance">
              {WEDDING_CONFIG.bridesParents.fatherName}
            </h3>
            <p className="font-script text-2xl text-[#C6A15B] leading-none py-0.5">dan</p>
            <h3 className="font-heading font-bold text-gold-glow tracking-wide text-[clamp(1.25rem,4.5vw,1.95rem)] text-balance">
              {WEDDING_CONFIG.bridesParents.motherName}
            </h3>
          </div>

          {/* Exact Supplied Invitation Wording (Montserrat) */}
          <p className="font-body text-sm sm:text-base leading-relaxed text-[#F5F0E5] max-w-xl text-balance">
            {WEDDING_CONFIG.invitationCopy.familyInvitationText}
          </p>

          <RoyalDivider className="my-7" />

          {/* Reaffirming the Union in Cormorant Garamond Antique Gold */}
          <div className="space-y-2.5 text-center w-full">
            <p className="font-body text-xs uppercase tracking-[0.22em] text-[#C6A15B] font-semibold">
              Mempelai yang Diraikan
            </p>
            <p className="font-names font-bold text-gold-glow tracking-[0.04em] text-[clamp(1.2rem,4.3vw,1.85rem)] text-balance">
              {WEDDING_CONFIG.couple.brideFullName}
            </p>
            <p className="font-script text-2xl text-[#C6A15B]">bersama pasangannya</p>
            <p className="font-names font-bold text-gold-glow tracking-[0.04em] text-[clamp(1.2rem,4.3vw,1.85rem)] text-balance">
              {WEDDING_CONFIG.couple.groomFullName}
            </p>
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
