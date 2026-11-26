import { useState, useRef, useCallback, useEffect } from "react";

// Module-level tracking for touch devices so tapping one card pauses any active card
let activeTouchPause: (() => void) | null = null;

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

    try {
      video.currentTime = 0;
    } catch {
      // ignore in case video isn't ready
    }

    video.muted = !soundOn;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
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
