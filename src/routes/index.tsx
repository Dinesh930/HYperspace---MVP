import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Upload,
  Sparkles,
  Share2,
  Film,
  Play,
  Check,
  X,
  ArrowRight,
  Volume2,
  VolumeX,
  Wand2,
  Rocket,
  Star,
} from "lucide-react";
import {
  useScrolled,
  useRevealOnScroll,
  HalftoneBackground,
  AmbientGlows,
  CursorTrail,
  Nav,
  FloatingCta,
  EarlyAccessButton,
  Footer,
  Badge,
  SectionHeader,
} from "../components/site-chrome";
import { VIDEO_BASE_URL } from "../lib/videos";

const COMPARISON_ROWS = [
  {
    label: "Cost per listing",
    traditional: "$500-1,200",
    traditionalStrike: true,
    hyperspace: "Pay as you render",
  },
  {
    label: "Turnaround time",
    traditional: "3-7 days",
    traditionalStrike: true,
    hyperspace: "2 minutes",
  },
  {
    label: "Scheduling required",
    traditional: "check",
    hyperspace: "x",
  },
  {
    label: "Consistent quality",
    traditional: "Varies by videographer",
    hyperspace: "Same quality every time",
  },
  {
    label: "All video formats included",
    traditional: "Extra charge",
    hyperspace: "check",
  },
  {
    label: "Weekend/holiday availability",
    traditional: "Limited",
    hyperspace: "24/7",
  },
  {
    label: "Revisions",
    traditional: "Extra charge",
    hyperspace: "Included",
  },
];

const HERO_VIDEOS = {
  a: `${VIDEO_BASE_URL}/template-08.mp4`,
  b: `${VIDEO_BASE_URL}/template-07.mp4`,
  c: `${VIDEO_BASE_URL}/template-02.mp4`,
};

const HERO_FOCUS: Record<"a" | "b" | "c", string> = {
  a: "center",
  b: "center",
  c: "center",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ property: "og:image", content: "https://cinora.ai/og.jpg" }],
  }),
  component: Landing,
});

function Landing() {
  const scrolled = useScrolled();
  useRevealOnScroll();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <HalftoneBackground />
      <AmbientGlows />
      <CursorTrail />

      <Nav scrolled={scrolled} />
      <FloatingCta />

      <main className="relative z-10">
        <Hero />
        <PhotoVideoShowcase />
        <LaunchStrip />
        <WhatWeDo />
        <HowItWorks />
        <FinalCTA />
        <ComparisonSection />
      </main>

      <Footer />
    </div>
  );
}

/* ---------------- HERO ---------------- */

interface HeroCardConfig {
  id: "a" | "b" | "c";
  videoSrc: string;
  label: string;
  style: {
    left: string;
    top: string;
    width: string;
    aspectRatio: string;
  };
  rotation: number;
  floatDuration: number;
  isEmphasis?: boolean;
  isPrimaryPill?: boolean;
  baseZ: number;
}

const HERO_CARD_CONFIGS: HeroCardConfig[] = [
  {
    id: "a",
    videoSrc: HERO_VIDEOS.a,
    label: "Template 08",
    style: { left: "7%", top: "15.5%", width: "42.5%", aspectRatio: "245/320" },
    rotation: -3.5,
    floatDuration: 6,
    baseZ: 10,
  },
  {
    id: "b",
    videoSrc: HERO_VIDEOS.b,
    label: "★ Template 07",
    style: { left: "32%", top: "3%", width: "49.5%", aspectRatio: "285/340" },
    rotation: 3,
    floatDuration: 7,
    isEmphasis: true,
    isPrimaryPill: true,
    baseZ: 20,
  },
  {
    id: "c",
    videoSrc: HERO_VIDEOS.c,
    label: "Template 02",
    style: { left: "49.5%", top: "53.4%", width: "40.8%", aspectRatio: "1/1" },
    rotation: -4,
    floatDuration: 8,
    baseZ: 30,
  },
];

function HeroCollageCard({
  config,
  isActive,
  isLocked,
  isSoundOn,
  onToggleSound,
  onClick,
  onVideoEnd,
}: {
  config: HeroCardConfig;
  isActive: boolean;
  isLocked: boolean;
  isSoundOn: boolean;
  onToggleSound: () => void;
  onClick: () => void;
  onVideoEnd: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const lastTimeRef = useRef<number>(0);
  const stallCountRef = useRef<number>(0);

  // Sync muted property via ref
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isSoundOn;
  }, [isSoundOn]);

  // Control playback based on isActive & isLocked
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (isActive) {
      video.loop = isLocked;
      video.currentTime = 0;
      video.muted = !isSoundOn;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      video.loop = false;
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive, isLocked, isSoundOn, hasError]);

  // Safety net watchdog: if video makes no progress for 5s while active (and not locked), skip to next
  useEffect(() => {
    if (!isActive || isLocked || hasError) return;

    stallCountRef.current = 0;
    lastTimeRef.current = videoRef.current?.currentTime || 0;

    const interval = setInterval(() => {
      const video = videoRef.current;
      if (!video) return;

      if (video.currentTime === lastTimeRef.current && !video.paused) {
        stallCountRef.current += 1;
        if (stallCountRef.current >= 5) {
          onVideoEnd();
        }
      } else {
        stallCountRef.current = 0;
        lastTimeRef.current = video.currentTime;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isLocked, hasError, onVideoEnd]);

  const handleEnded = () => {
    if (!isLocked) {
      onVideoEnd();
    }
  };

  const handleError = () => {
    setHasError(true);
    if (!isLocked) {
      onVideoEnd();
    }
  };

  return (
    <motion.div
      onClick={onClick}
      data-cursor="hover"
      style={{
        left: config.style.left,
        top: config.style.top,
        width: config.style.width,
        aspectRatio: config.style.aspectRatio,
        zIndex: isActive ? 35 : config.baseZ,
      }}
      initial={{ rotate: config.rotation }}
      animate={
        shouldReduceMotion
          ? { rotate: config.rotation, scale: isActive ? 1.03 : 1 }
          : { y: [0, -8, 0], rotate: config.rotation, scale: isActive ? 1.03 : 1 }
      }
      transition={{
        y: { duration: config.floatDuration, repeat: Infinity, ease: "easeInOut" },
        scale: { duration: 0.3 },
      }}
      className={`absolute cursor-pointer rounded-[24px] overflow-hidden bg-neutral-900 border border-black/10 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)] transition-shadow duration-300 select-none ${
        config.isEmphasis
          ? "ring-2 ring-primary shadow-[0_0_60px_-10px_rgba(109,94,248,0.55)]"
          : ""
      }`}
    >
      {/* Label Pill */}
      <div
        className={`absolute left-3 top-3 z-20 flex items-center rounded-full bg-black/55 backdrop-blur text-[11px] font-semibold px-2.5 py-1 border shadow-sm ${
          config.isPrimaryPill ? "border-primary/60 text-white" : "border-white/15 text-white"
        }`}
      >
        {config.label}
      </div>

      {/* Sound Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSound();
        }}
        data-cursor="hover"
        aria-label={isSoundOn ? "Turn sound off" : "Turn sound on"}
        title={isSoundOn ? "Turn sound off" : "Turn sound on"}
        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 backdrop-blur border border-white/15 text-white shadow-sm transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {isSoundOn ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4 text-white/70" />
        )}
      </button>

      {hasError ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-900 p-4 text-center">
          <Film className="h-8 w-8 text-neutral-600" />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={config.videoSrc}
          preload="auto"
          muted={!isSoundOn}
          playsInline
          onEnded={handleEnded}
          onError={handleError}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: HERO_FOCUS[config.id] || "center" }}
        />
      )}

      {/* Dim overlay and play icon when inactive */}
      {!isActive && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity duration-300">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-black/55 backdrop-blur text-white shadow-lg border border-white/20">
            <Play className="h-4 w-4 fill-white translate-x-0.5" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function HeroCollage() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [locked, setLocked] = useState<boolean>(false);
  const [soundId, setSoundId] = useState<"a" | "b" | "c" | null>(null);

  const handleCardClick = (index: number) => {
    if (activeIdx === index && locked) {
      // Unlock and resume auto sequence
      setLocked(false);
    } else {
      // Lock on this card
      setActiveIdx(index);
      setLocked(true);
    }
  };

  const handleToggleSound = (id: "a" | "b" | "c", index: number) => {
    if (soundId === id) {
      setSoundId(null);
    } else {
      setSoundId(id);
      if (activeIdx !== index) {
        setActiveIdx(index);
      }
    }
  };

  const handleVideoEnd = () => {
    if (!locked) {
      setActiveIdx((prev) => (prev + 1) % 3);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-[600px] aspect-[576/547]">
      {/* Soft Purple Glow Behind Collage */}
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, #6D5EF8 0%, transparent 70%)",
          opacity: 0.25,
        }}
      />

      {HERO_CARD_CONFIGS.map((config, index) => (
        <HeroCollageCard
          key={config.id}
          config={config}
          isActive={activeIdx === index}
          isLocked={locked}
          isSoundOn={soundId === config.id}
          onToggleSound={() => handleToggleSound(config.id, index)}
          onClick={() => handleCardClick(index)}
          onVideoEnd={handleVideoEnd}
        />
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative pt-8 md:pt-12 lg:pt-14">
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          {/* Left Column */}
          <div className="animate-fade-up flex flex-col items-start text-left">
            <Badge>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Early Access · Try It Live
            </Badge>
            <h1 className="mt-6 text-balance text-[44px] font-semibold leading-[1.03] tracking-[-0.03em] sm:text-[56px] lg:text-[68px] xl:text-[76px]">
              Photos in.
              <br />
              <span className="relative inline-block bg-gradient-to-r from-primary via-primary-soft to-primary bg-clip-text text-transparent">
                Cinematic out.
              </span>
            </h1>
            <p className="mt-6 max-w-[520px] text-[17px] leading-[1.6] text-muted-foreground sm:text-[18px]">
              Hyper space converts your property photos into stunning, AI-generated marketing videos —
              ready for Reels, TikTok, YouTube, your website, and everywhere your listings live.
            </p>

            <div className="mt-9 inline-flex flex-col items-center gap-3">
              <EarlyAccessButton />
            </div>
          </div>

          {/* Right Column: Three Tilted Cards Collage */}
          <HeroCollage />
        </div>
      </div>
    </section>
  );
}


/* ---------------- PHOTOS → VIDEO SHOWCASE (dedicated section) ---------------- */
const SHOWCASE_PHOTOS = [
  { id: "bedroom", alt: "Bedroom listing photo", src: "/images/showcase/s6.png" },
  { id: "bar", alt: "Bar area listing photo", src: "/images/showcase/s5.png" },
  { id: "kitchen", alt: "Kitchen listing photo", src: "/images/showcase/s3.png" },
  { id: "living", alt: "Living room listing photo", src: "/images/showcase/s2.png" },
];
const SHOWCASE_VIDEO_SRC = "/videos/showcase/kling_20260721_VIDEO_Transform__745_0.mp4";

function PhotoVideoShowcase() {
  return (
    <section id="see-it-in-action" className="relative mt-20 md:mt-28">
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <SectionHeader
          eyebrow="See it in action"
          title="Your photos, turned into one cinematic video."
        />

        <div className="relative mx-auto mt-14 grid max-w-[1000px] grid-cols-1 items-center gap-8 md:grid-cols-[1fr_90px_1fr] md:gap-6">
          <div
            aria-hidden
            className="ambient-glow left-1/2 top-1/2 -z-10 h-[420px] w-[560px] -translate-x-1/2 -translate-y-1/2"
            style={{
              background: "radial-gradient(circle, #6D5EF8 0%, transparent 70%)",
              opacity: 0.22,
            }}
          />

          <div className="mx-auto flex w-full max-w-[300px] flex-col items-center gap-4">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Site Photos
            </span>
            <div className="grid w-full grid-cols-2 gap-3">
              {SHOWCASE_PHOTOS.map((p, i) => (
                <div
                  key={p.id}
                  className="reveal aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_-14px_rgba(15,23,42,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-16px_rgba(15,23,42,0.3)]"
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <img src={p.src} alt={p.alt} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div
            className="reveal mx-auto flex items-center justify-center"
            style={{ transitionDelay: "280ms" }}
          >
            <div className="ptv-arrow-track ptv-arrow-track-v md:hidden" aria-hidden>
              <span className="ptv-slide-arrow ptv-slide-arrow-v" />
              <span
                className="ptv-slide-arrow ptv-slide-arrow-v"
                style={{ animationDelay: "1.1s" }}
              />
            </div>
            <div className="ptv-arrow-track ptv-arrow-track-h hidden md:flex" aria-hidden>
              <span className="ptv-slide-arrow ptv-slide-arrow-h" />
              <span
                className="ptv-slide-arrow ptv-slide-arrow-h"
                style={{ animationDelay: "1.1s" }}
              />
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[260px] flex-col items-center gap-4">
            <div
              className="reveal animate-float relative w-full"
              style={{ transitionDelay: "360ms", animationDuration: "8s" }}
            >
              <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[24px] border border-border bg-black shadow-[0_30px_90px_-30px_rgba(15,23,42,0.35)]">
                <video
                  className="h-full w-full object-cover"
                  src={SHOWCASE_VIDEO_SRC}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />

                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 backdrop-blur">
                  <span className="cin-rec-dot h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px] font-medium tracking-wider text-white">REC</span>
                </div>

                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium tracking-wide text-white backdrop-blur">
                  AI Generated
                </span>
              </div>

              <FloatingChip className="left-[-14px] top-[-14px] delay-100">
                <Film className="h-3.5 w-3.5 text-primary" /> Cinematic
              </FloatingChip>
              <FloatingChip className="bottom-[-14px] right-[-14px] delay-300">
                <Wand2 className="h-3.5 w-3.5 text-primary" /> AI Generated
              </FloatingChip>
            </div>
            <span className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              Your Video
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}


function FloatingChip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`animate-float absolute inline-flex items-center gap-1.5 rounded-full border border-border bg-white/90 px-3 py-1.5 text-[12.5px] font-medium text-foreground shadow-[0_8px_24px_-10px_rgba(15,23,42,0.15)] backdrop-blur ${className}`}
      style={{ animationDuration: "9s" }}
    >
      {children}
    </div>
  );
}

/* ---------------- LAUNCH STRIP ---------------- */

function LaunchStrip() {
  const items = [
    { icon: <Rocket className="h-4 w-4" />, label: "Early Access Open" },
    { icon: <Film className="h-4 w-4" />, label: "AI Video Generation" },
    { icon: <Star className="h-4 w-4" />, label: "Founder Pricing" },
  ];
  return (
    <section className="mt-28 md:mt-36">
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <div className="reveal flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-white/70 px-4 py-3 backdrop-blur-sm sm:gap-8">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-[14px] text-foreground/80">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary">
                {it.icon}
              </span>
              <span className="font-medium">{it.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ---------------- WHAT WE DO ---------------- */

function WhatWeDo() {
  return (
    <section id="what-we-do" className="mt-28 md:mt-40 scroll-mt-24">
      {/* Future feature placeholder: WhatWeDo section content will go here */}
    </section>
  );
}


/* ---------------- HOW IT WORKS ---------------- */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: <Film className="h-5 w-5" />,
      title: "Pick a Cinematic Template",
      body: "Choose a style. Every template has its own camera moves built in, so there is nothing to prompt.",
    },
    {
      n: "02",
      icon: <Upload className="h-5 w-5" />,
      title: "Add Your Listing Photos",
      body: "Select your property photos: interiors, exteriors, drone shots. Hyper space handles the pacing and transitions.",
    },
    {
      n: "03",
      icon: <Share2 className="h-5 w-5" />,
      title: "Publish Everywhere",
      body: "Export perfectly formatted videos for Reels, TikTok, YouTube, and your website.",
    },
  ];
  return (
    <section id="how-it-works" className="mt-28 md:mt-40 scroll-mt-24">
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <SectionHeader eyebrow="How it works" title="From photos to cinema in three steps." />
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.n}
              data-cursor="hover"
              className="reveal group relative rounded-2xl border border-border bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_rgba(109,94,248,0.4)]"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {s.icon}
                </span>
                <span className="text-[13px] font-medium tracking-widest text-muted-foreground/70">
                  {s.n}
                </span>
              </div>
              <h3 className="mt-8 text-[22px] font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ---------------- FINAL CTA ---------------- */

function FinalCTA() {
  return (
    <section className="mt-28 md:mt-40">
      <div className="mx-auto w-full max-w-[1100px] px-6">
        <div className="reveal relative overflow-hidden rounded-[28px] border border-border bg-white px-6 py-16 text-center shadow-[0_30px_120px_-40px_rgba(109,94,248,0.35)] sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="ambient-glow left-1/2 top-[-160px] h-[400px] w-[600px] -translate-x-1/2"
            style={{
              background: "radial-gradient(circle, #8B7CFF 0%, transparent 70%)",
              opacity: 0.35,
            }}
          />
          <div className="relative">
            <Badge>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Early Access
            </Badge>
            <h2 className="mx-auto mt-6 max-w-[720px] text-balance text-[36px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[48px]">
              Be first to experience{" "}
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                <span style={{ color: "#000000" }}>Hyper</span>{" "}
                <span className="relative inline-block bg-gradient-to-r from-primary via-primary-soft to-primary bg-clip-text text-transparent">
                  space
                </span>
              </span>
              .
            </h2>
            <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-[1.6] text-muted-foreground">
              See how Hyper space turns listing photos into cinematic walkthroughs. Pick a template, choose your photos, and generate.
            </p>
            <div className="mx-auto mt-9 flex flex-col items-center justify-center">
              <EarlyAccessButton />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- COMPARISON SECTION ---------------- */

function ComparisonSection() {
  return (
    <section className="mt-28 md:mt-40">
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <div className="reveal mx-auto max-w-[720px] text-center">
          <h2 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[44px]">
            Skip the $500 shoot.
            <br />
            <span className="relative inline-block bg-gradient-to-r from-primary via-primary-soft to-primary bg-clip-text text-transparent">
              And the 3-7 day wait.
            </span>
          </h2>
        </div>

        <div className="reveal relative mx-auto mt-12 w-full max-w-[900px] pt-3.5 pb-3.5 sm:mt-16">
          {/* Highlight card: absolutely positioned panel BEHIND the table, bounds ONLY the table */}
          <div
            className="absolute right-0 top-0 bottom-0 w-[36%] sm:w-[33%] z-0 rounded-[20px] bg-white border border-primary/20 shadow-[0_20px_60px_-30px_rgba(109,94,248,0.35)] pointer-events-none"
            aria-hidden="true"
          />

          <table className="relative z-10 w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-[35%] sm:w-[38%]" />
              <col className="w-[29%]" />
              <col className="w-[36%] sm:w-[33%]" />
            </colgroup>
            <thead>
              <tr className="h-[64px]">
                <th className="bg-transparent" />
                <th className="bg-transparent px-1 text-center text-[9.5px] font-medium uppercase tracking-[0.14em] sm:tracking-[0.18em] text-muted-foreground sm:px-4 sm:text-[11px]">
                  Traditional videographer
                </th>
                <th className="bg-transparent px-1 text-center text-[15px] font-semibold text-foreground sm:px-4 sm:text-[20px]">
                  HyperSpace
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="h-[56px] md:h-[60px]">
                  <td className="border-t border-border bg-transparent pl-1.5 pr-1 text-left align-middle text-[10px] text-muted-foreground sm:pl-4 sm:pr-2 sm:text-[13px] break-words">
                    {row.label}
                  </td>
                  <td className="border-t border-border bg-transparent px-1 text-center align-middle text-[10px] text-muted-foreground sm:px-2 sm:text-[13px] break-words">
                    {row.traditional === "check" ? (
                      <div className="flex items-center justify-center">
                        <Check className="h-4 w-4 stroke-[2.5] text-muted-foreground" />
                      </div>
                    ) : row.traditional === "x" ? (
                      <div className="flex items-center justify-center">
                        <X className="h-4 w-4 stroke-[2.5] text-muted-foreground" />
                      </div>
                    ) : row.traditionalStrike ? (
                      <span className="line-through opacity-75">{row.traditional}</span>
                    ) : (
                      row.traditional
                    )}
                  </td>
                  <td className="border-t border-border bg-transparent px-1 text-center align-middle text-[11px] font-medium text-foreground sm:px-2 sm:text-[15px] md:text-[17px] break-words">
                    {row.hyperspace === "check" ? (
                      <div className="flex items-center justify-center">
                        <Check className="h-4 w-4 stroke-[2.5] text-primary" />
                      </div>
                    ) : row.hyperspace === "x" ? (
                      <div className="flex items-center justify-center">
                        <X className="h-4 w-4 stroke-[2.5] text-muted-foreground" />
                      </div>
                    ) : (
                      row.hyperspace
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footnote and Link moved outside wrapper in normal document flow */}
        <p className="relative z-10 mt-10 text-center text-[14px] text-muted-foreground">
          Based on average videographer rates of $500-1,200 per property video
        </p>

        <div className="relative z-10 mt-4 flex justify-center">
          <Link
            to="/studio"
            data-cursor="hover"
            className="inline-flex items-center gap-1.5 text-[16.5px] font-medium text-primary transition-[text-shadow,opacity] duration-200 hover:opacity-80 active:[text-shadow:0_0_12px_rgba(109,94,248,0.55)] focus-visible:[text-shadow:0_0_12px_rgba(109,94,248,0.55)] focus-visible:outline-none"
          >
            Try it on your next listing
            <ArrowRight className="h-[17px] w-[17px]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
