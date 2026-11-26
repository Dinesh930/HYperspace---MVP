import { useState, useRef, useCallback, useEffect } from "react";

// Module-level tracking for touch devices so tapping one card pauses any active card
let activeTouchPause: (() => void) | null = null;

// Module-level tracking for RAF smooth scroll so overlapping calls cancel safely
let activeScrollCancel: (() => void) | null = null;

function animateScrollTo(
  getTargetY: () => number,
  options: { duration?: number } = {},
) {
  if (typeof window === "undefined") return;

  // Cancel any ongoing smooth scroll animation before starting a new one
  if (activeScrollCancel) {
    activeScrollCancel();
    activeScrollCancel = null;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    window.scrollTo({ top: getTargetY(), behavior: "instant" });
    return;
  }

  const startY = window.scrollY;
  const initialTarget = getTargetY();
  const distance = Math.abs(initialTarget - startY);
  if (distance < 1) return;

  const duration = options.duration ?? Math.min(900, Math.max(400, 400 + distance / 5));
  const startTime = performance.now();
  let rafId: number | null = null;

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function cleanup() {
    window.removeEventListener("wheel", onUserCancel, { passive: true } as EventListenerOptions);
    window.removeEventListener("touchstart", onUserCancel, { passive: true } as EventListenerOptions);
    window.removeEventListener("keydown", onUserCancel);
    if (activeScrollCancel === cancel) {
      activeScrollCancel = null;
    }
  }

  function cancel() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    cleanup();
  }

  function onUserCancel() {
    cancel();
  }

  activeScrollCancel = cancel;

  window.addEventListener("wheel", onUserCancel, { passive: true });
  window.addEventListener("touchstart", onUserCancel, { passive: true });
  window.addEventListener("keydown", onUserCancel);

  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);

    const targetY = getTargetY();
    const currentY = startY + (targetY - startY) * eased;

    window.scrollTo({ top: currentY, behavior: "instant" });

    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      cleanup();
    }
  }

  rafId = requestAnimationFrame(step);
}

export function smoothScrollToElement(
  el: HTMLElement | null,
  options: { offset?: number; duration?: number } = {},
) {
  if (!el || typeof window === "undefined") return;
  const offset = options.offset ?? (64 + 8); // sticky header height (64px) + 8px
  animateScrollTo(
    () => Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset),
    { duration: options.duration ?? 650 },
  );
}

export function smoothScrollToTop() {
  if (typeof window === "undefined") return;
  const startY = window.scrollY;
  if (startY <= 0) return;
  const duration = Math.min(900, Math.max(400, 400 + startY / 5));
  animateScrollTo(() => 0, { duration });
}

export function useHoverVideo({
  videoRef,
  soundOn = false,
  onAutoplayBlocked,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  soundOn?: boolean;
  onAutoplayBlocked?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isTouchRef = useRef(false);

  // Keep volume/muted in sync with soundOn
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !soundOn;
    }
  }, [soundOn, videoRef]);

  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Immediately set preload to auto and reset to 0
    video.preload = "auto";
    try {
      video.currentTime = 0;
    } catch {
      // ignore in case video isn't ready
    }

    video.muted = !soundOn;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err?.name === "AbortError") {
          return;
        }
        if (soundOn && onAutoplayBlocked) {
          video.muted = true;
          onAutoplayBlocked();
          video.play().catch(() => {});
        }
      });
    }
    setIsPlaying(true);
  }, [soundOn, onAutoplayBlocked, videoRef]);

  const stopPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // ignore
    }
    setIsPlaying(false);
  }, [videoRef]);

  // Desktop / Mouse Pointer Enter
  const handlePointerEnter = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") {
        isTouchRef.current = true;
        return;
      }
      setIsHovered(true);
      startPlayback();
    },
    [startPlayback],
  );

  // Desktop / Mouse Pointer Leave
  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return;
      setIsHovered(false);
      stopPlayback();
    },
    [stopPlayback],
  );

  // Touch / Mobile Tap
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      // Only process tap on touch devices or if triggered by touch
      const isTouchDevice =
        isTouchRef.current ||
        (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches);

      if (!isTouchDevice) return;

      if (isPlaying) {
        stopPlayback();
        if (activeTouchPause === stopPlayback) {
          activeTouchPause = null;
        }
      } else {
        if (activeTouchPause && activeTouchPause !== stopPlayback) {
          activeTouchPause();
        }
        activeTouchPause = stopPlayback;
        startPlayback();
      }
    },
    [isPlaying, startPlayback, stopPlayback],
  );

  return {
    isPlaying,
    isHovered,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    onClick: handleCardClick,
    stopPlayback,
    startPlayback,
  };
}
