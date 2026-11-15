import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MailOpen } from 'lucide-react';
import { WEDDING_CONFIG } from './config/weddingConfig';
import { EnvelopeOpening } from './components/EnvelopeOpening';
import { MainInvitation } from './components/MainInvitation';
import { FamilyInvitation } from './components/FamilyInvitation';
import { WeddingDetails } from './components/WeddingDetails';
import { SharedAlbumSection } from './components/SharedAlbumSection';
import { GuestbookSection } from './components/GuestbookSection';
import { RsvpSection } from './components/RsvpSection';
import { PalaceNavigation } from './components/PalaceNavigation';
import { FloatingPetalsAndSparkles, MonogramZP, RoyalDivider } from './components/RoyalOrnaments';
import {
  BackgroundMusicHandle,
  BackgroundMusicPlayer,
} from './components/BackgroundMusicPlayer';
import emeraldSongketBg from './assets/images/malay_songket_emerald_bg_1794719929264.jpg';

export default function App() {
  const [isOpened, setIsOpened] = useState(false);
  const musicPlayerRef = useRef<BackgroundMusicHandle>(null);

  const handleOpenStart = () => {
    musicPlayerRef.current?.startFromGesture();
  };

  const handleOpenComplete = () => {
    setIsOpened(true);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleReplayEnvelope = () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setIsOpened(false);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#064E3B] text-[#16261F] overflow-x-hidden">
      <BackgroundMusicPlayer ref={musicPlayerRef} />

      <AnimatePresence mode="wait">
        {!isOpened ? (
          <EnvelopeOpening
            key="envelope-stage"
            onOpenStart={handleOpenStart}
            onOpenComplete={handleOpenComplete}
          />
        ) : (
          <motion.div
            key="invitation-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="relative min-h-[100dvh] w-full bg-[#064E3B]"
          >
            {/* Persistent Emerald Songket Backdrop with Deep Radial Scrim */}
            <div className="pointer-events-none fixed inset-0 z-0">
              <img
                src={emeraldSongketBg}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover opacity-20 mix-blend-luminosity"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 25%, rgba(6,78,59,0.58) 0%, rgba(3,43,32,0.92) 78%, rgba(2,29,21,0.98) 100%)',
                }}
              />
            </div>

            {/* Subtle Floating Jasmine Petals & Gold Dust */}
            <FloatingPetalsAndSparkles variant="emerald" />

            {/* Responsive Navigation */}
            <PalaceNavigation onReplayEnvelope={handleReplayEnvelope} />

            {/* Scrollable Royal Palace Experience (top mobile padding reserves clean space for top-right Menu & Sound controls) */}
            <main className="relative z-20 pt-[calc(env(safe-area-inset-top,0px)+4rem)] md:pt-0">
              <MainInvitation />
              <FamilyInvitation />
              <WeddingDetails />
              <SharedAlbumSection />
              <GuestbookSection />
              <RsvpSection />
            </main>

            {/* Quiet Royal Footer (keeps bottom margin spacious and clear of host badges) */}
            <footer className="relative z-20 pb-20 md:pb-16 pt-4 px-4 text-center text-[#F5F0E5]/85">
              <div className="max-w-xl mx-auto space-y-4">
                <RoyalDivider />
                <MonogramZP className="w-16 h-[52px] mx-auto" label="Monogram Diraja ZP" />
                <p className="font-names text-xl sm:text-2xl font-semibold text-gold-glow tracking-wide">
                  Nur Zaireen Farisya &amp; Putera Faizal Hakimi
                </p>
                <p className="font-body text-xs uppercase tracking-[0.2em] text-[#C6A15B]">
                  {WEDDING_CONFIG.event.dateDisplayMs} · {WEDDING_CONFIG.event.venueName}
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleReplayEnvelope}
                    className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl border border-[#C6A15B]/60 bg-[#032B20]/70 font-body text-xs font-semibold uppercase tracking-wider text-[#E6CB8E] hover:bg-[#032B20] transition-colors cursor-pointer"
                  >
                    <MailOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Buka Semula Sampul Jemputan</span>
                  </button>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
