import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { WEDDING_CONFIG } from '../config/weddingConfig';

export interface BackgroundMusicHandle {
  /** Must be called synchronously inside a user click/tap handler for iOS & Android autoplay compatibility */
  startFromGesture: () => void;
}

interface BackgroundMusicPlayerProps {
  /** Adjusts bottom spacing when mobile bottom nav bar is visible */
  hasBottomNav: boolean;
}

/**
 * Malay Royal Gamelan / Asli Pentatonic Frequencies (D Major Pentatonic / Pelog-inspired)
 * Warm, serene tempo (~68 BPM) tailored for a Royal Malay Palace entrance.
 */
const MELODY_SEQUENCE: Array<{ freq: number; duration: number; role: 'chime' | 'bell' | 'rest' }> = [
  { freq: 587.33, duration: 0.9, role: 'bell' },   // D5
  { freq: 659.25, duration: 0.9, role: 'chime' },  // E5
  { freq: 739.99, duration: 1.35, role: 'bell' },  // F#5
  { freq: 587.33, duration: 0.9, role: 'chime' },  // D5
  { freq: 493.88, duration: 1.35, role: 'bell' },  // B4
  { freq: 440.00, duration: 1.8, role: 'chime' },  // A4
  { freq: 369.99, duration: 0.9, role: 'chime' },  // F#4
  { freq: 440.00, duration: 0.9, role: 'bell' },   // A4
  { freq: 493.88, duration: 0.9, role: 'chime' },  // B4
  { freq: 587.33, duration: 1.8, role: 'bell' },   // D5
  { freq: 440.00, duration: 0.9, role: 'chime' },  // A4
  { freq: 369.99, duration: 0.9, role: 'chime' },  // F#4
  { freq: 329.63, duration: 1.35, role: 'bell' },  // E4
  { freq: 293.66, duration: 2.25, role: 'bell' },  // D4 (resolution)
];

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

interface YTGlobal {
  Player: new (
    element: HTMLElement,
    options: {
      height?: string | number;
      width?: string | number;
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YTPlayerInstance }) => void;
        onStateChange?: (event: { target: YTPlayerInstance; data: number }) => void;
        onError?: (event: { data: number }) => void;
      };
    }
  ) => YTPlayerInstance;
  PlayerState?: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YTGlobal;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const BackgroundMusicPlayer = forwardRef<
  BackgroundMusicHandle,
  BackgroundMusicPlayerProps
>(({ hasBottomNav }, ref) => {
  const customUrl = WEDDING_CONFIG.music?.customTrackUrl?.trim() ?? '';
  const youtubeVideoId = WEDDING_CONFIG.music?.youtubeVideoId?.trim() ?? '';
  const hasCustomTrack = Boolean(customUrl);
  const hasYouTubeTrack = !hasCustomTrack && Boolean(youtubeVideoId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const schedulerTimerRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);
  const userManuallyMutedRef = useRef(false);
  const isPlayingRef = useRef(false);

  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const ytReadyRef = useRef(false);
  const ytFailedRef = useRef(false);
  const pendingPlayRef = useRef(true);
  const hasUnlockedAudioRef = useRef(false);
  const autoplayVerifyTimerRef = useRef<number | null>(null);

  const playSynthStep = useCallback((ctx: AudioContext, master: GainNode, stepIdx: number) => {
    const note = MELODY_SEQUENCE[stepIdx % MELODY_SEQUENCE.length];
    const now = ctx.currentTime;

    if (note.role !== 'rest') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(note.freq, now);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(note.freq * 2.003, now);

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(note.role === 'bell' ? 0.16 : 0.08, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1900, now);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(note.role === 'bell' ? 0.24 : 0.18, now + 0.035);
      noteGain.gain.exponentialRampToValueAtTime(0.0008, now + note.duration * 1.45);

      osc1.connect(filter);
      osc2.connect(overtoneGain);
      overtoneGain.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(master);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + note.duration * 1.5);
      osc2.stop(now + note.duration * 1.5);
    }

    if (stepIdx % 7 === 0) {
      const gongOsc = ctx.createOscillator();
      const gongGain = ctx.createGain();
      gongOsc.type = 'sine';
      gongOsc.frequency.setValueAtTime(stepIdx % 14 === 0 ? 146.83 : 110.0, now);

      gongGain.gain.setValueAtTime(0.0001, now);
      gongGain.gain.linearRampToValueAtTime(0.18, now + 0.18);
      gongGain.gain.exponentialRampToValueAtTime(0.0008, now + 4.2);

      gongOsc.connect(gongGain);
      gongGain.connect(master);

      gongOsc.start(now);
      gongOsc.stop(now + 4.3);
    }
  }, []);

  const stopSynthLoop = useCallback(() => {
    if (schedulerTimerRef.current !== null) {
      window.clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
  }, []);

  const startSynthLoop = useCallback(() => {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioCtxRef.current) {
      const ctx = new AudioContextClass();
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.22, ctx.currentTime);
      master.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = master;
    }

    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.22, ctx.currentTime, 0.25);

    stopSynthLoop();

    const scheduleNext = () => {
      if (!audioCtxRef.current || !masterGainRef.current) return;
      const currentIdx = stepIndexRef.current;
      const note = MELODY_SEQUENCE[currentIdx % MELODY_SEQUENCE.length];
      playSynthStep(audioCtxRef.current, masterGainRef.current, currentIdx);
      stepIndexRef.current = (currentIdx + 1) % MELODY_SEQUENCE.length;
      schedulerTimerRef.current = window.setTimeout(scheduleNext, note.duration * 1000);
    };

    scheduleNext();
    isPlayingRef.current = true;
    setIsPlaying(true);
    setIsMuted(false);
  }, [playSynthStep, stopSynthLoop]);

  const scheduleYouTubePlayVerification = useCallback((allowMutedWarmup = false) => {
    if (autoplayVerifyTimerRef.current !== null) {
      window.clearTimeout(autoplayVerifyTimerRef.current);
    }
    autoplayVerifyTimerRef.current = window.setTimeout(() => {
      const player = ytPlayerRef.current;
      if (!player || ytFailedRef.current) return;
      const state = player.getPlayerState();
      // Only 1 (PLAYING) or 3 (BUFFERING) means playback actually started
      if (state !== 1 && state !== 3) {
        if (allowMutedWarmup && !userManuallyMutedRef.current) {
          // Browser blocked unmuted autoplay on initial load; pre-start muted stream so first tap unmutes instantaneously
          try {
            player.mute();
            player.playVideo();
            isPlayingRef.current = true;
            setIsPlaying(true);
            setIsMuted(true);
          } catch {
            isPlayingRef.current = false;
            setIsPlaying(false);
          }
          return;
        }
        isPlayingRef.current = false;
        setIsPlaying(false);
      }
    }, 1100);
  }, []);

  const triggerYouTubePlay = useCallback(
    (player: YTPlayerInstance, allowMutedWarmup = false) => {
      try {
        player.setVolume(55);
        player.unMute();
        player.playVideo();
        isPlayingRef.current = true;
        setIsPlaying(true);
        setIsMuted(false);
        scheduleYouTubePlayVerification(allowMutedWarmup);
      } catch {
        ytFailedRef.current = true;
        startSynthLoop();
      }
    },
    [scheduleYouTubePlayVerification, startSynthLoop]
  );

  // Initialize YouTube IFrame Player upfront and immediately attempt playback when app opens
  useEffect(() => {
    if (!hasYouTubeTrack) return;

    let cancelled = false;

    const mountPlayer = () => {
      if (cancelled || !ytContainerRef.current || ytPlayerRef.current || !window.YT?.Player) {
        return;
      }

      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        height: '200',
        width: '200',
        videoId: youtubeVideoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          loop: 1,
          modestbranding: 1,
          playsinline: 1,
          playlist: youtubeVideoId,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: ({ target }) => {
            if (cancelled) return;
            ytPlayerRef.current = target;
            ytReadyRef.current = true;
            target.setVolume(55);

            if (pendingPlayRef.current && !userManuallyMutedRef.current) {
              pendingPlayRef.current = false;
              triggerYouTubePlay(target, true);
            }
          },
          onStateChange: ({ target, data }) => {
            if (cancelled) return;
            // 0 = ENDED -> seamless loop fallback
            if (data === 0 && !userManuallyMutedRef.current) {
              target.seekTo(0, true);
              target.playVideo();
              return;
            }
            // 1 = PLAYING
            if (data === 1) {
              if (autoplayVerifyTimerRef.current !== null) {
                window.clearTimeout(autoplayVerifyTimerRef.current);
                autoplayVerifyTimerRef.current = null;
              }
              ytFailedRef.current = false;
              const currentlyMuted = target.isMuted();
              isPlayingRef.current = true;
              setIsPlaying(true);
              setIsMuted(currentlyMuted);
              if (!currentlyMuted) {
                hasUnlockedAudioRef.current = true;
              }
            } else if (data === 2 && !document.hidden) {
              // 2 = PAUSED (either user or browser policy)
              if (!target.isMuted()) {
                isPlayingRef.current = false;
                setIsPlaying(false);
              }
            }
          },
          onError: () => {
            if (cancelled) return;
            ytFailedRef.current = true;
            ytReadyRef.current = false;
            if (pendingPlayRef.current || (isPlayingRef.current && !userManuallyMutedRef.current)) {
              pendingPlayRef.current = false;
              startSynthLoop();
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      mountPlayer();
    } else {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        mountPlayer();
      };

      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => {
          ytFailedRef.current = true;
          if (pendingPlayRef.current && !userManuallyMutedRef.current) {
            pendingPlayRef.current = false;
            startSynthLoop();
          }
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (autoplayVerifyTimerRef.current !== null) {
        window.clearTimeout(autoplayVerifyTimerRef.current);
        autoplayVerifyTimerRef.current = null;
      }
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore destroy cleanup errors
        }
        ytPlayerRef.current = null;
      }
      ytReadyRef.current = false;
    };
  }, [hasYouTubeTrack, startSynthLoop, triggerYouTubePlay, youtubeVideoId]);

  const startPlayback = useCallback(() => {
    if (hasCustomTrack && audioElRef.current) {
      audioElRef.current.volume = 0.35;
      audioElRef.current.muted = false;
      const playPromise = audioElRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlayingRef.current = true;
            hasUnlockedAudioRef.current = true;
            setIsPlaying(true);
            setIsMuted(false);
          })
          .catch(() => {
            isPlayingRef.current = false;
            setIsPlaying(false);
          });
      }
      return;
    }

    if (hasYouTubeTrack && !ytFailedRef.current) {
      if (ytReadyRef.current && ytPlayerRef.current) {
        triggerYouTubePlay(ytPlayerRef.current, false);
      } else {
        pendingPlayRef.current = true;
      }
      return;
    }

    startSynthLoop();
  }, [hasCustomTrack, hasYouTubeTrack, startSynthLoop, triggerYouTubePlay]);

  // Immediate autoplay attempt on mount (for custom audio / synth) + global first-gesture unlock
  useEffect(() => {
    if (!hasYouTubeTrack && !userManuallyMutedRef.current && !isPlayingRef.current) {
      startPlayback();
    }

    const handleFirstInteraction = (event: Event) => {
      if (hasUnlockedAudioRef.current || userManuallyMutedRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.('[data-music-toggle="true"]')) return;

      if (hasYouTubeTrack && !ytFailedRef.current) {
        if (ytReadyRef.current && ytPlayerRef.current) {
          const player = ytPlayerRef.current;
          const state = player.getPlayerState();
          if (state !== 1 || player.isMuted()) {
            triggerYouTubePlay(player, false);
          } else {
            hasUnlockedAudioRef.current = true;
          }
        } else {
          pendingPlayRef.current = true;
        }
        return;
      }

      if (!isPlayingRef.current || (audioCtxRef.current && audioCtxRef.current.state === 'suspended')) {
        startPlayback();
      } else {
        hasUnlockedAudioRef.current = true;
      }
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { capture: true, passive: true });
    window.addEventListener('click', handleFirstInteraction, { capture: true, passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction, { capture: true });
      window.removeEventListener('touchstart', handleFirstInteraction, { capture: true });
      window.removeEventListener('click', handleFirstInteraction, { capture: true });
      window.removeEventListener('keydown', handleFirstInteraction, { capture: true });
    };
  }, [hasYouTubeTrack, startPlayback, triggerYouTubePlay]);

  useImperativeHandle(
    ref,
    () => ({
      startFromGesture: () => {
        if (!userManuallyMutedRef.current) {
          if (hasYouTubeTrack && ytReadyRef.current && ytPlayerRef.current && !ytFailedRef.current) {
            const player = ytPlayerRef.current;
            if (player.getPlayerState() !== 1 || player.isMuted()) {
              triggerYouTubePlay(player, false);
            }
          } else if (!isPlayingRef.current) {
            startPlayback();
          }
        }
      },
    }),
    [hasYouTubeTrack, startPlayback, triggerYouTubePlay]
  );

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (hasCustomTrack && audioElRef.current) {
          audioElRef.current.pause();
        }
        if (hasYouTubeTrack && ytReadyRef.current && ytPlayerRef.current) {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch {
            // ignore
          }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
          void audioCtxRef.current.suspend();
        }
      } else if (isPlaying && !isMuted && !userManuallyMutedRef.current) {
        if (hasCustomTrack && audioElRef.current) {
          void audioElRef.current.play().catch(() => {});
        }
        if (hasYouTubeTrack && ytReadyRef.current && ytPlayerRef.current && !ytFailedRef.current) {
          try {
            ytPlayerRef.current.playVideo();
          } catch {
            // ignore
          }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          void audioCtxRef.current.resume();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [hasCustomTrack, hasYouTubeTrack, isMuted, isPlaying]);

  useEffect(() => {
    return () => {
      stopSynthLoop();
      if (audioCtxRef.current) {
        void audioCtxRef.current.close();
      }
    };
  }, [stopSynthLoop]);

  const handleToggleMute = async () => {
    // Handle YouTube active playback & mute toggle
    if (hasYouTubeTrack && !ytFailedRef.current) {
      if (!ytReadyRef.current || !ytPlayerRef.current) {
        const nextMuted = isPlaying && !isMuted;
        userManuallyMutedRef.current = nextMuted;
        pendingPlayRef.current = !nextMuted;
        setIsPlaying(!nextMuted);
        setIsMuted(nextMuted);
        return;
      }

      const player = ytPlayerRef.current;
      const state = player.getPlayerState();
      if (!isPlaying || (state !== 1 && state !== 3)) {
        userManuallyMutedRef.current = false;
        triggerYouTubePlay(player);
        return;
      }

      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      userManuallyMutedRef.current = nextMuted;
      if (nextMuted) {
        player.mute();
      } else {
        hasUnlockedAudioRef.current = true;
        player.unMute();
        player.setVolume(55);
        player.playVideo();
      }
      return;
    }

    if (!isPlaying) {
      userManuallyMutedRef.current = false;
      startPlayback();
      return;
    }

    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    userManuallyMutedRef.current = nextMuted;

    if (hasCustomTrack && audioElRef.current) {
      audioElRef.current.muted = nextMuted;
      if (!nextMuted && audioElRef.current.paused) {
        void audioElRef.current.play().catch(() => {});
      }
    }

    if (audioCtxRef.current && masterGainRef.current) {
      const ctx = audioCtxRef.current;
      const master = masterGainRef.current;
      master.gain.cancelScheduledValues(ctx.currentTime);
      if (nextMuted) {
        master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
        stopSynthLoop();
      } else {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        startSynthLoop();
      }
    }
  };

  const isAudible = isPlaying && !isMuted;
  const trackLabel = WEDDING_CONFIG.music?.trackTitle || 'muzik latar';

  return (
    <>
      {hasCustomTrack && (
        <audio ref={audioElRef} src={customUrl} loop preload="none" playsInline />
      )}

      {hasYouTubeTrack && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed -left-[9999px] top-0 w-[200px] h-[200px] opacity-0 overflow-hidden"
        >
          <div ref={ytContainerRef} />
        </div>
      )}

      <button
        type="button"
        data-music-toggle="true"
        onClick={handleToggleMute}
        aria-label={
          isAudible
            ? `Bisukan ${trackLabel}`
            : `Mainkan ${trackLabel}`
        }
        aria-pressed={isAudible}
        title={isAudible ? `Bisukan: ${trackLabel}` : `Mainkan: ${trackLabel}`}
        className={`fixed right-3.5 sm:right-6 z-40 w-11 h-11 rounded-full bg-[#032B20]/90 backdrop-blur-md border border-[#C6A15B]/80 text-[#E6CB8E] shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:bg-[#064E3B] hover:border-[#E6CB8E] active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E6CB8E] ${
          hasBottomNav ? 'bottom-[72px] md:bottom-6' : 'bottom-5 sm:bottom-6'
        }`}
      >
        {isAudible ? (
          <Volume2 className="w-[18px] h-[18px]" aria-hidden="true" />
        ) : (
          <VolumeX className="w-[18px] h-[18px] text-[#C6A15B]/75" aria-hidden="true" />
        )}
      </button>
    </>
  );
});

BackgroundMusicPlayer.displayName = 'BackgroundMusicPlayer';
