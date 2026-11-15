import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Check, Clock, Copy, MapPin, Navigation } from 'lucide-react';
import { WEDDING_CONFIG } from '../config/weddingConfig';
import { AwanLaratCorner, RoyalDivider } from './RoyalOrnaments';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

function calculateTimeRemaining(startIso: string, endIso: string): TimeRemaining {
  const now = Date.now();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  if (now >= start && now <= end) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, status: 'ongoing' };
  }
  if (now > end) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, status: 'completed' };
  }

  const diff = Math.max(0, start - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, status: 'upcoming' };
}

function formatTwoDigits(n: number): string {
  return String(n).padStart(2, '0');
}

export const WeddingDetails: React.FC = () => {
  const [countdown, setCountdown] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(
      WEDDING_CONFIG.event.isoStartDateTime,
      WEDDING_CONFIG.event.isoEndDateTime
    )
  );
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(
        calculateTimeRemaining(
          WEDDING_CONFIG.event.isoStartDateTime,
          WEDDING_CONFIG.event.isoEndDateTime
        )
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const googleCalendarHref = useMemo(() => {
    const title = encodeURIComponent(
      `${WEDDING_CONFIG.event.title}: Nur Zaireen Farisya & Putera Faizal Hakimi`
    );
    const details = encodeURIComponent(
      `Jemputan ke Majlis Walimatulurus ${WEDDING_CONFIG.couple.brideFullName} & ${WEDDING_CONFIG.couple.groomFullName}. Anjuran ${WEDDING_CONFIG.bridesParents.fatherName} & ${WEDDING_CONFIG.bridesParents.motherName}.`
    );
    const location = encodeURIComponent(
      `${WEDDING_CONFIG.event.venueName}, ${WEDDING_CONFIG.event.fullAddress}`
    );
    const dates = '20261212T103000Z/20261212T150000Z';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  }, []);

  const handleDownloadIcs = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Royal Malay Palace//Walimatulurus//MS',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:walimatulurus-farisya-faizal-20261212@royalmalaypalace',
      'DTSTAMP:20261115T000000Z',
      'DTSTART:20261212T103000Z',
      'DTEND:20261212T150000Z',
      `SUMMARY:${WEDDING_CONFIG.event.title} - Nur Zaireen Farisya & Putera Faizal Hakimi`,
      `DESCRIPTION:Jemputan ke Majlis Walimatulurus ${WEDDING_CONFIG.couple.brideFullName} & ${WEDDING_CONFIG.couple.groomFullName}.`,
      `LOCATION:${WEDDING_CONFIG.event.venueName}\\, ${WEDDING_CONFIG.event.fullAddress.replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Walimatulurus-Faizal-Farisya-12Dis2026.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyAddress = async () => {
    const textToCopy = `${WEDDING_CONFIG.event.venueName}\n${WEDDING_CONFIG.event.fullAddress}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedAddress(true);
      window.setTimeout(() => setCopiedAddress(false), 2600);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedAddress(true);
      window.setTimeout(() => setCopiedAddress(false), 2600);
    }
  };

  return (
    <section
      id="butiran"
      aria-label="Butiran Majlis, Kiraan Detik dan Lokasi"
      className="relative w-full py-6 sm:py-10 px-3 sm:px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl rounded-3xl bg-songket-ivory border border-[#C6A15B]/80 shadow-[0_22px_60px_rgba(3,43,32,0.4)] px-4 sm:px-10 md:px-12 py-11 sm:py-14 overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#C6A15B]/40" />
        <AwanLaratCorner position="tl" className="absolute top-3.5 left-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="tr" className="absolute top-3.5 right-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="bl" className="absolute bottom-3.5 left-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="br" className="absolute bottom-3.5 right-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto">
            <p className="font-script text-2xl sm:text-3xl text-[#8E6D31]">
              Atur Cara &amp; Ketetapan
            </p>
            <h2 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#064E3B] text-balance">
              Butiran Majlis
            </h2>
            <p className="mt-1.5 font-body text-xs uppercase tracking-[0.2em] text-[#8E6D31] font-semibold">
              {WEDDING_CONFIG.event.title}
            </p>
            <RoyalDivider className="mt-4" />
          </div>

          {/* 2-Column Responsive Layout on Desktop, Clean Vertical Stack on Mobile */}
          <div className="mt-9 grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-stretch">
            {/* Left Column: Date, Time, Venue & Full Address */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl bg-[#FAF7F0]/95 border border-[#C6A15B]/50 p-5 sm:p-8 space-y-6">
              {/* Tarikh */}
              <div className="flex items-start gap-3.5 sm:gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#064E3B] text-[#E6CB8E] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-body text-xs uppercase tracking-[0.18em] text-[#8E6D31] font-semibold">
                    Tarikh &amp; Hari
                  </p>
                  <p className="mt-1 font-heading text-lg sm:text-2xl font-bold text-[#064E3B]">
                    {WEDDING_CONFIG.event.dateDisplayMs}
                  </p>
                </div>
              </div>

              <div className="h-[1px] bg-[#C6A15B]/25" />

              {/* Masa */}
              <div className="flex items-start gap-3.5 sm:gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#064E3B] text-[#E6CB8E] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-body text-xs uppercase tracking-[0.18em] text-[#8E6D31] font-semibold">
                    Masa Majlis
                  </p>
                  <p className="mt-1 font-heading text-lg sm:text-2xl font-bold text-[#064E3B] tabular-nums">
                    {WEDDING_CONFIG.event.timeDisplayMs}
                  </p>
                </div>
              </div>

              <div className="h-[1px] bg-[#C6A15B]/25" />

              {/* Lokasi & Alamat Penuh */}
              <div className="flex items-start gap-3.5 sm:gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#064E3B] text-[#E6CB8E] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="font-body text-xs uppercase tracking-[0.18em] text-[#8E6D31] font-semibold">
                    Lokasi Dewan
                  </p>
                  <p className="mt-1 font-heading text-lg sm:text-2xl font-bold text-[#064E3B]">
                    {WEDDING_CONFIG.event.venueName}
                  </p>
                  <p className="mt-1.5 font-body text-xs sm:text-sm leading-relaxed text-[#16261F]/85">
                    {WEDDING_CONFIG.event.fullAddress}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Directions + Copy Address */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3 font-body">
                <a
                  href={WEDDING_CONFIG.event.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-[#064E3B] text-[#FAF7F0] font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md hover:bg-[#043B2C] active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F0]"
                >
                  <Navigation className="w-4 h-4 text-[#E6CB8E]" aria-hidden="true" />
                  <span>Arah Lokasi (Google Maps)</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="min-h-[48px] px-5 py-3 rounded-xl border border-[#C6A15B] bg-[#F5F0E5] text-[#064E3B] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#EDE4D2] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]"
                >
                  {copiedAddress ? (
                    <>
                      <Check className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
                      <span>Alamat Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#8E6D31]" aria-hidden="true" />
                      <span>Salin Alamat</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Live Countdown Timer & Add to Calendar */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-songket-emerald text-[#FAF7F0] border border-[#C6A15B]/75 p-5 sm:p-8 shadow-lg">
              <div>
                <p className="font-script text-2xl text-[#E6CB8E] text-center">
                  Menghitung Hari Bahagia
                </p>
                <h3 className="mt-1 font-heading text-xl sm:text-2xl font-bold text-center text-[#FAF7F0] tracking-wide">
                  12 DISEMBER 2026
                </h3>

                {/* Countdown Grid */}
                {countdown.status === 'upcoming' ? (
                  <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3" aria-live="polite">
                    {[
                      { label: 'Hari', value: countdown.days },
                      { label: 'Jam', value: formatTwoDigits(countdown.hours) },
                      { label: 'Minit', value: formatTwoDigits(countdown.minutes) },
                      { label: 'Saat', value: formatTwoDigits(countdown.seconds) },
                    ].map((unit) => (
                      <div
                        key={unit.label}
                        className="rounded-xl bg-[#032B20]/85 border border-[#C6A15B]/50 py-3.5 px-1 text-center flex flex-col items-center justify-center"
                      >
                        <span className="font-heading text-2xl sm:text-3xl font-bold text-gold-glow tabular-nums leading-none">
                          {unit.value}
                        </span>
                        <span className="mt-1.5 font-body text-[10px] uppercase tracking-wider text-[#F5F0E5]/85">
                          {unit.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : countdown.status === 'ongoing' ? (
                  <div className="mt-6 rounded-xl bg-[#032B20]/85 border border-[#C6A15B]/55 p-5 text-center">
                    <p className="font-heading text-xl font-bold text-[#E6CB8E]">
                      Majlis Sedang Berlangsung
                    </p>
                    <p className="mt-1 font-body text-xs sm:text-sm text-[#F5F0E5]/85">
                      Selamat datang ke Laman Ratu Event Hall
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl bg-[#032B20]/85 border border-[#C6A15B]/55 p-5 text-center">
                    <p className="font-heading text-xl font-bold text-[#E6CB8E]">
                      Alhamdulillah, Majlis Selesai
                    </p>
                    <p className="mt-1 font-body text-xs sm:text-sm text-[#F5F0E5]/85">
                      Terima kasih atas doa dan kehadiran anda
                    </p>
                  </div>
                )}
              </div>

              {/* Add to Calendar Actions */}
              <div className="mt-8 pt-6 border-t border-[#C6A15B]/30 space-y-3 font-body">
                <p className="text-xs uppercase tracking-[0.18em] text-[#E6CB8E] text-center font-medium">
                  Simpan Tarikh ke Kalendar
                </p>

                <a
                  href={googleCalendarHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B89047] via-[#E2C27E] to-[#B89047] text-[#032B20] font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF7F0]"
                >
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span>Tambah ke Google Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#C6A15B]/75 bg-[#032B20]/70 text-[#FAF7F0] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#032B20] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6CB8E]"
                >
                  <Calendar className="w-4 h-4 text-[#E6CB8E]" aria-hidden="true" />
                  <span>Kalendar Apple / Telefon (.ics)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
