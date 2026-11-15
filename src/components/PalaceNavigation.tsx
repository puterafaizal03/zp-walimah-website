import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Heart,
  Images,
  MailOpen,
  Menu,
  MessageSquareHeart,
  Sparkles,
  Users,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

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

  // Close mobile menu on Escape or tap outside
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [mobileMenuOpen]);

  const scrollToSection = (id: string) => {
    setActiveId(id);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Desktop Sticky Top Bar (reserves right slot for fixed Sound button so controls sit side-by-side cleanly) */}
      <header className="hidden md:flex sticky top-0 z-30 min-h-[68px] items-center justify-between gap-5 lg:gap-8 pl-6 lg:pl-8 md:pr-[82px] py-3 bg-[#032B20]/92 backdrop-blur-md border-b border-[#C6A15B]/35">
        <a
          href="#jemputan"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('jemputan');
          }}
          className="inline-flex items-center gap-2.5 font-heading text-base lg:text-lg font-bold tracking-wider text-gold-glow whitespace-nowrap shrink-0"
        >
          <MonogramZP className="w-8 lg:w-9 h-[26px] lg:h-[30px] shrink-0" />
          <span aria-hidden="true" className="text-[#C6A15B]/75">·</span>
          <span>Walimatulurus</span>
        </a>

        <nav
          aria-label="Navigasi utama"
          className="flex items-center gap-3.5 lg:gap-6 font-body text-xs lg:text-sm font-medium text-[#F5F0E5]/85"
        >
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
          className="min-h-[44px] px-3.5 lg:px-4 py-2 rounded-full border border-[#C6A15B]/80 bg-[#064E3B] text-[#E6CB8E] font-body text-xs font-semibold tracking-wider uppercase hover:bg-[#043B2C] transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <MailOpen className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Buka Sampul</span>
        </button>
      </header>

      {/* Mobile Top-Right Floating Menu Button + Dropdown (positioned neatly beside top-right Mute/Sound button) */}
      <div ref={mobileMenuRef} className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-palace-menu"
          aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          className="fixed top-[calc(env(safe-area-inset-top,0px)+12px)] right-[68px] sm:right-[78px] z-40 h-11 px-3.5 rounded-full bg-[#032B20]/95 backdrop-blur-md border border-[#C6A15B]/85 text-[#E6CB8E] shadow-[0_8px_24px_rgba(0,0,0,0.45)] hover:bg-[#064E3B] hover:border-[#E6CB8E] active:scale-95 transition-all duration-200 inline-flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6CB8E]"
        >
          {mobileMenuOpen ? (
            <X className="w-4 h-4 shrink-0" aria-hidden="true" />
          ) : (
            <Menu className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span className="font-body text-xs font-semibold tracking-wider uppercase">
            Menu
          </span>
        </button>

        {mobileMenuOpen && (
          <nav
            id="mobile-palace-menu"
            aria-label="Navigasi mudah alih"
            className="fixed top-[calc(env(safe-area-inset-top,0px)+66px)] right-3.5 sm:right-6 z-40 w-60 rounded-2xl bg-[#032B20]/95 backdrop-blur-md border border-[#C6A15B]/80 shadow-[0_20px_50px_rgba(0,0,0,0.55)] p-2 font-body"
          >
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl flex items-center gap-3 text-left text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#064E3B] text-[#E6CB8E] border border-[#C6A15B]/55'
                        : 'text-[#F5F0E5]/90 hover:bg-[#064E3B]/65 hover:text-[#E6CB8E]'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#C6A15B] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="my-2 border-t border-[#C6A15B]/30" />

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onReplayEnvelope();
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#064E3B]/80 border border-[#C6A15B]/60 text-[#E6CB8E] text-xs font-semibold uppercase tracking-wider flex items-center gap-2.5 hover:bg-[#064E3B] transition-colors cursor-pointer"
            >
              <MailOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Buka Semula Sampul</span>
            </button>
          </nav>
        )}
      </div>
    </>
  );
};
