import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink, HeartHandshake, Lock } from 'lucide-react';
import { WEDDING_CONFIG } from '../config/weddingConfig';
import { AwanLaratCorner, RoyalDivider } from './RoyalOrnaments';

export const RsvpSection: React.FC = () => {
  const googleFormUrl = WEDDING_CONFIG.rsvpGoogleForms.publicFormUrl;

  return (
    <section
      id="rsvp"
      aria-label="Pengesahan Kehadiran (RSVP)"
      className="relative w-full py-6 sm:py-10 px-3 sm:px-6 pb-24 sm:pb-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl rounded-3xl bg-songket-ivory border border-[#C6A15B]/80 shadow-[0_24px_65px_rgba(3,43,32,0.45)] px-5 sm:px-10 md:px-12 py-11 sm:py-14 overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#C6A15B]/40" />
        <AwanLaratCorner position="tl" className="absolute top-3.5 left-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="tr" className="absolute top-3.5 right-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="bl" className="absolute bottom-3.5 left-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="br" className="absolute bottom-3.5 right-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />

        <div className="relative z-10 max-w-xl mx-auto text-center">
          {/* Header */}
          <p className="font-script text-2xl sm:text-3xl text-[#8E6D31]">
            Sahkan Kehadiran Anda
          </p>
          <h2 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#064E3B]">
            Pengesahan Kehadiran
          </h2>
          <RoyalDivider className="mt-4" />

          {/* Royal Emerald Crest Emblem */}
          <div className="mt-7 mx-auto w-14 h-14 rounded-full bg-[#064E3B] border border-[#C6A15B] shadow-md flex items-center justify-center">
            <HeartHandshake className="w-7 h-7 text-[#E6CB8E]" aria-hidden="true" />
          </div>

          {/* Required Message Above RSVP Button */}
          <p className="mt-5 font-body text-sm sm:text-base text-[#16261F]/90 leading-relaxed text-balance">
            Mohon sahkan kehadiran anda melalui pautan RSVP di bawah bagi membantu pihak keluarga membuat persiapan majlis.
          </p>

          {/* Primary Royal Malay Palace RSVP Button opening exact Google Form in new tab */}
          <div className="mt-7 flex justify-center">
            <motion.a
              href={googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="group relative overflow-hidden w-full sm:w-auto min-h-[54px] px-7 sm:px-9 py-4 rounded-xl bg-[#064E3B] border border-[#C6A15B] text-[#FAF7F0] font-body font-bold text-sm sm:text-base tracking-[0.08em] uppercase shadow-[0_14px_32px_rgba(6,78,59,0.32),0_0_0_1px_rgba(198,161,91,0.35)] hover:bg-[#043B2C] hover:border-[#E6CB8E] transition-colors duration-200 inline-flex items-center justify-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F0E5]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-[#E6CB8E]/20 to-transparent"
              />
              <span className="relative z-10 text-[#E6CB8E]">
                SAHKAN KEHADIRAN (RSVP)
              </span>
              <ExternalLink
                className="relative z-10 w-4 h-4 text-[#C6A15B] group-hover:text-[#E6CB8E] transition-colors shrink-0"
                aria-hidden="true"
              />
            </motion.a>
          </div>

          {/* Privacy Note */}
          <div className="mt-6 flex items-center justify-center gap-2 font-body text-xs text-[#16261F]/70">
            <Lock className="w-3.5 h-3.5 text-[#8E6D31] shrink-0" aria-hidden="true" />
            <span>
              Maklumat tetamu adalah sulit dan direkodkan secara peribadi melalui borang rasmi.
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
