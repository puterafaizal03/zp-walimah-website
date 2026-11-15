import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Heart,
  Images,
  MailOpen,
  MessageSquareHeart,
  Sparkles,
  Users,
} from 'lucide-react';
import { MonogramZP } from './RoyalOrnaments';

interface PalaceNavigationProps {
  onReplayEnvelope: () => void;
}

const NAV_ITEMS = [
  { id: 'jemputan', label: 'Jemputan', icon: Sparkles },
  { id: 'keluarga', label: 'Keluarga', icon: Users },
  { id: 'butiran', label: 'Butiran', icon: Calendar },
  { id: 'galeri', label: 'Galeri', icon: Images },
  { id: 'ucapan', label: 'Ucapan', icon: MessageSquareHeart },
  { id: 'rsvp', label: 'RSVP', icon: Heart },
] as const;

export const PalaceNavigation: React.FC<PalaceNavigationProps> = ({ onReplayEnvelope }) => {
  const [activeId, setActiveId] = useState<string>('jemputan');

  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      Boolean
    ) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-25% 0px -45% 0px',
        threshold: [0.1, 0.3, 0.6],
      }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Desktop Top Bar (3-zone contract: Brand — 5 Single-line Links — 1 Primary Action) */}
      <header className="hidden md:flex sticky top-0 z-30 items-center justify-between gap-8 px-8 py-3.5 bg-[#032B20]/90 backdrop-blur-md border-b border-[#C6A15B]/35">
        <a
          href="#jemputan"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('jemputan');
          }}
          className="inline-flex items-center gap-2.5 font-heading text-lg font-bold tracking-wider text-gold-glow whitespace-nowrap shrink-0"
        >
          <MonogramZP className="w-9 h-[30px] shrink-0" />
          <span aria-hidden="true" className="text-[#C6A15B]/75">·</span>
          <span>Walimatulurus</span>
        </a>

        <nav aria-label="Navigasi utama" className="flex items-center gap-6 font-body text-sm font-medium text-[#F5F0E5]/85">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(item.id);
              }}
              className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors ${
                activeId === item.id
                  ? 'text-[#E6CB8E] border-[#C6A15B]'
                  : 'border-transparent hover:text-[#E6CB8E]'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={onReplayEnvelope}
          className="min-h-[40px] px-4 py-2 rounded-lg border border-[#C6A15B]/75 bg-[#064E3B] text-[#E6CB8E] font-body text-xs font-semibold tracking-wider uppercase hover:bg-[#043B2C] transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <MailOpen className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Buka Sampul</span>
        </button>
      </header>

      {/* Mobile Bottom Thumb-Zone Tab Bar (Height 58px < 10% of mobile viewport) */}
      <nav
        aria-label="Navigasi mudah alih"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#032B20]/95 backdrop-blur-md border-t border-[#C6A15B]/45 px-1 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-6 items-center h-[58px] max-w-md mx-auto font-body">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-[#E6CB8E]' : 'text-[#F5F0E5]/70 hover:text-[#F5F0E5]'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
