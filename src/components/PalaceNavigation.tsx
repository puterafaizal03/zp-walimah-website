import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Heart,
  Images,
  MailOpen,
  Menu,
  MessageCircle,
  MessageSquareHeart,
  Phone,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { WEDDING_CONFIG } from '../config/weddingConfig';
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

const FamilyContactsList: React.FC = () => {
  const groups = [
    WEDDING_CONFIG.familyContacts.brideSide,
    WEDDING_CONFIG.familyContacts.groomSide,
  ];

  return (
    <div className="space-y-3" aria-label="Maklumat Perhubungan Keluarga">
      {groups.map((group) => (
        <div
          key={group.heading}
          className="rounded-xl bg-[#064E3B]/55 border border-[#C6A15B]/40 p-2.5 space-y-2"
        >
          <p className="font-body text-[10px] font-bold uppercase tracking-[0.14em] text-[#E6CB8E] leading-snug">
            {group.heading}
          </p>

          <div className="space-y-1.5">
            {group.contacts.map((contact) => (
              <div
                key={`${group.heading}-${contact.label}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-[#032B20]/80 border border-[#C6A15B]/25 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="font-body text-[11px] font-semibold text-[#FAF7F0] leading-tight">
                    {contact.label}
                  </p>
                  <a
                    href={contact.telHref}
                    className="mt-0.5 inline-flex items-center gap-1 font-body text-xs font-medium text-[#E6CB8E] hover:text-[#FFF0C4] underline decoration-[#C6A15B]/50 underline-offset-2 tabular-nums"
                  >
                    <Phone className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>{contact.displayNumber}</span>
                  </a>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={contact.telHref}
                    aria-label={`Telefon ${contact.label} (${contact.displayNumber})`}
                    title={`Telefon ${contact.label}`}
                    className="min-h-[36px] min-w-[36px] rounded-lg border border-[#C6A15B]/50 bg-[#064E3B] text-[#E6CB8E] hover:bg-[#086048] flex items-center justify-center transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                  <a
                    href={contact.waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`WhatsApp ${contact.label} (${contact.displayNumber})`}
                    title={`WhatsApp ${contact.label}`}
                    className="min-h-[36px] px-2.5 rounded-lg bg-gradient-to-r from-[#B89047] via-[#E2C27E] to-[#B89047] text-[#032B20] font-body text-[10px] font-bold uppercase tracking-wider hover:brightness-105 inline-flex items-center gap-1 transition-all"
                  >
                    <MessageCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>WA</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const PalaceNavigation: React.FC<PalaceNavigationProps> = ({ onReplayEnvelope }) => {
  const [activeId, setActiveId] = useState<string>('jemputan');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopContactsOpen, setDesktopContactsOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopContactsRef = useRef<HTMLDivElement | null>(null);

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

  // Close menus on Escape or tap outside
  useEffect(() => {
    if (!mobileMenuOpen && !desktopContactsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setDesktopContactsOpen(false);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const targetNode = e.target as Node;
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(targetNode)) {
        setMobileMenuOpen(false);
      }
      if (
        desktopContactsOpen &&
        desktopContactsRef.current &&
        !desktopContactsRef.current.contains(targetNode)
      ) {
        setDesktopContactsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [desktopContactsOpen, mobileMenuOpen]);

  const scrollToSection = (id: string) => {
    setActiveId(id);
    setMobileMenuOpen(false);
    setDesktopContactsOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Desktop Sticky Top Bar (reserves right slot for fixed Sound button so controls sit side-by-side cleanly) */}
      <header className="hidden md:flex sticky top-0 z-30 min-h-[68px] items-center justify-between gap-3 lg:gap-6 pl-4 lg:pl-8 md:pr-[78px] lg:pr-[84px] py-3 bg-[#032B20]/92 backdrop-blur-md border-b border-[#C6A15B]/35">
        <a
          href="#jemputan"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('jemputan');
          }}
          className="inline-flex items-center gap-2 font-heading text-base lg:text-lg font-bold tracking-wider text-gold-glow whitespace-nowrap shrink-0"
        >
          <MonogramZP className="w-8 lg:w-9 h-[26px] lg:h-[30px] shrink-0" />
          <span aria-hidden="true" className="hidden lg:inline text-[#C6A15B]/75">·</span>
          <span className="hidden lg:inline">Walimatulurus</span>
        </a>

        <nav
          aria-label="Navigasi utama"
          className="flex items-center gap-3 lg:gap-5 font-body text-xs lg:text-sm font-medium text-[#F5F0E5]/85"
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

        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop Family Contact Menu Dropdown */}
          <div ref={desktopContactsRef} className="relative">
            <button
              type="button"
              onClick={() => setDesktopContactsOpen((prev) => !prev)}
              aria-expanded={desktopContactsOpen}
              aria-controls="desktop-family-contacts"
              className="min-h-[42px] px-3 lg:px-3.5 py-2 rounded-full border border-[#C6A15B]/75 bg-[#032B20] text-[#E6CB8E] font-body text-xs font-semibold tracking-wider uppercase hover:bg-[#064E3B] transition-colors cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hubungi</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  desktopContactsOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {desktopContactsOpen && (
              <div
                id="desktop-family-contacts"
                role="region"
                aria-label="Senarai Hubungi Keluarga"
                className="absolute right-0 top-[calc(100%+10px)] z-40 w-[330px] max-h-[75dvh] overflow-y-auto rounded-2xl bg-[#032B20]/98 backdrop-blur-md border border-[#C6A15B]/80 shadow-[0_20px_50px_rgba(0,0,0,0.55)] p-3.5"
              >
                <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-[#C6A15B]/30">
                  <span className="font-heading text-sm font-bold text-[#E6CB8E] tracking-wide">
                    Hubungi Keluarga
                  </span>
                  <button
                    type="button"
                    onClick={() => setDesktopContactsOpen(false)}
                    aria-label="Tutup senarai hubungi"
                    className="p-1 rounded-lg text-[#C6A15B] hover:text-[#FAF7F0] hover:bg-[#064E3B] cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <FamilyContactsList />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onReplayEnvelope}
            className="min-h-[42px] px-3 lg:px-4 py-2 rounded-full border border-[#C6A15B]/80 bg-[#064E3B] text-[#E6CB8E] font-body text-xs font-semibold tracking-wider uppercase hover:bg-[#043B2C] transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <MailOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Buka Sampul</span>
          </button>
        </div>
      </header>

      {/* Mobile Top-Right Floating Menu Button + Dropdown (positioned neatly beside top-right Mute/Sound button with clean gap) */}
      <div ref={mobileMenuRef} className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-palace-menu"
          aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          className="fixed top-[calc(env(safe-area-inset-top,0px)+12px)] right-[70px] sm:right-[80px] z-40 h-11 px-3.5 rounded-full bg-[#032B20]/95 backdrop-blur-md border border-[#C6A15B]/85 text-[#E6CB8E] shadow-[0_8px_24px_rgba(0,0,0,0.45)] hover:bg-[#064E3B] hover:border-[#E6CB8E] active:scale-95 transition-all duration-200 inline-flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6CB8E]"
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
            aria-label="Navigasi dan maklumat hubungi mudah alih"
            className="fixed top-[calc(env(safe-area-inset-top,0px)+66px)] right-3 sm:right-6 z-40 w-[min(21rem,calc(100vw-24px))] max-h-[calc(100dvh-env(safe-area-inset-top,0px)-96px)] overflow-y-auto overscroll-contain rounded-2xl bg-[#032B20]/97 backdrop-blur-md border border-[#C6A15B]/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-3 font-body"
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

            <div className="my-3 border-t border-[#C6A15B]/35" />

            {/* Family Contact Section inside Mobile Menu */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <Phone className="w-3.5 h-3.5 text-[#C6A15B] shrink-0" aria-hidden="true" />
                <span className="font-heading text-xs font-bold uppercase tracking-[0.16em] text-[#E6CB8E]">
                  Hubungi Keluarga
                </span>
              </div>
              <FamilyContactsList />
            </div>

            <div className="my-3 border-t border-[#C6A15B]/35" />

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onReplayEnvelope();
              }}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#064E3B]/80 border border-[#C6A15B]/60 text-[#E6CB8E] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2.5 hover:bg-[#064E3B] transition-colors cursor-pointer"
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
