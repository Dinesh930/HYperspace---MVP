import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, Fragment } from "react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Upload,
  Sparkles,
  Share2,
  Film,
  Play,
  Layers,
  Clock,
  Building2,
  Rocket,
  Wand2,
  Star,
  MousePointerClick,
  Clapperboard,
  MonitorSmartphone,
  Coins,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import {
  useScrolled,
  useRevealOnScroll,
  HalftoneBackground,
  AmbientGlows,
  CursorTrail,
  Nav,
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
    hyperspace: "From $9/listing",
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

      <main className="relative z-10">
        <Hero />
        <PhotoVideoShowcase />
        <LaunchStrip />
        <WhatWeDo />
        <HowItWorks />
        <Why />
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
  onClick,
  onVideoEnd,
}: {
  config: HeroCardConfig;
  isActive: boolean;
  isLocked: boolean;
  onClick: () => void;
  onVideoEnd: () => void;
}) {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Control playback based on isActive & isLocked
  useEffect(() => {
    const main = mainVideoRef.current;
    const bg = bgVideoRef.current;
    if (!main || hasError) return;

    if (isActive) {
      main.loop = isLocked;
      if (bg) bg.loop = isLocked;

      const playPromise = main.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (bg) {
              bg.currentTime = main.currentTime;
              bg.play().catch(() => {});
            }
          })
          .catch(() => {});
      }
    } else {
      main.loop = false;
      main.pause();
      main.currentTime = 0.1;
      if (bg) {
        bg.loop = false;
        bg.pause();
        bg.currentTime = 0.1;
      }
    }
  }, [isActive, isLocked, hasError]);

  // Sync background video time occasionally
  const handleTimeUpdate = () => {
    const main = mainVideoRef.current;
    const bg = bgVideoRef.current;
    if (main && bg && Math.abs(main.currentTime - bg.currentTime) > 0.3) {
      bg.currentTime = main.currentTime;
    }
  };

  const handleEnded = () => {
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

      {hasError ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-900 p-4 text-center">
          <Film className="h-8 w-8 text-neutral-600" />
        </div>
      ) : (
        <>
          {/* Layer 1: Blurred background fill */}
          <video
            ref={bgVideoRef}
            src={`${config.videoSrc}#t=0.1`}
            preload="auto"
            muted
            playsInline
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover scale-125 blur-2xl opacity-70"
          />

          {/* Layer 2: Main crisp video on top */}
          <video
            ref={mainVideoRef}
            src={`${config.videoSrc}#t=0.1`}
            preload="auto"
            muted
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={() => setHasError(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          />
        </>
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
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto sequence when not locked
  useEffect(() => {
    if (locked) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Set 6-second max duration per card
    timerRef.current = setTimeout(() => {
      setActiveIdx((prev) => (prev + 1) % 3);
    }, 6000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIdx, locked]);

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

  const handleVideoEnd = () => {
    if (!locked) {
      if (timerRef.current) clearTimeout(timerRef.current);
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
              <Link
                to="/studio"
                data-cursor="hover"
                className="btn-glow-effect group inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full px-8 text-[14.5px] font-medium transition-all duration-300 hover:scale-105"
              >
                Get my free video
              </Link>
              <p className="text-[12.5px] text-muted-foreground text-center">
                No credit card required
              </p>
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
    <section className="relative mt-20 md:mt-28">
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
  const cards = [
    {
      n: "01",
      icon: <MousePointerClick className="h-5 w-5" />,
      title: "No prompts",
      body: "Pick a template and upload photos. Nothing to prompt, no manual editing.",
    },
    {
      n: "02",
      icon: <Clapperboard className="h-5 w-5" />,
      title: "Camera work built in",
      body: "Drone orbits, speed ramps and slow dolly-ins, crafted for each template.",
    },
    {
      n: "03",
      icon: <MonitorSmartphone className="h-5 w-5" />,
      title: "Any format",
      body: "Landscape (16:9), vertical (9:16) or square (1:1), from 480p to 1080p.",
    },
    {
      n: "04",
      icon: <Coins className="h-5 w-5" />,
      title: "Pay as you render",
      body: "Credits used per second rendered. Unused credits rollover automatically.",
    },
  ];

  return (
    <section id="what-we-do" className="mt-28 md:mt-40 scroll-mt-24">
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <div className="reveal mx-auto max-w-[960px] text-center">
          <span className="inline-block text-[12px] font-medium uppercase tracking-[0.18em] text-primary">
            What we do
          </span>
          <h2 className="mt-4 text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] sm:text-[44px]">
            The camera crew, the editor and the prompt,
            <br className="hidden sm:block" /> replaced by one template.
          </h2>
          <p className="mx-auto mt-5 max-w-[640px] text-[17px] leading-[1.6] text-muted-foreground">
            HyperSpace turns a handful of photos into a polished video with real camera movement, ready to post.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <div
              key={card.n}
              data-cursor="hover"
              className="reveal group relative rounded-2xl border border-border bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_rgba(109,94,248,0.4)]"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  {card.icon}
                </span>
                <span className="text-[13px] font-medium tracking-widest text-muted-foreground/70">
                  {card.n}
                </span>
              </div>
              <h3 className="mt-8 text-[22px] font-semibold tracking-tight">{card.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
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


/* ---------------- WHY ---------------- */

function Why() {
  const features = [
    {
      icon: <Film className="h-5 w-5" />,
      title: "Cinematic Results",
      body: "Studio-grade camera moves, color, and pacing — designed to feel handcrafted, not templated.",
    },
    {
      icon: <Layers className="h-5 w-5" />,
      title: "Multi-Platform Ready",
      body: "One click exports for Reels, TikTok, YouTube Shorts, MLS, and your website — sized perfectly.",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Save Time",
      body: "Skip editors, shoots, and revisions. Turn a batch of photos into a full campaign in minutes.",
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      title: "Built for Real Estate",
      body: "Trained on listings — from luxury estates to city apartments — so the output feels on-brand.",
    },
  ];
  return (
    <section className="mt-28 md:mt-40">
      <div className="mx-auto w-full max-w-[1240px] px-6">
        <SectionHeader eyebrow="Why Hyper space" title="A video studio for every listing." />
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
          {features.map((f, i) => (
            <div
              key={f.title}
              data-cursor="hover"
              className="reveal group flex gap-5 rounded-2xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_60px_-30px_rgba(109,94,248,0.35)]"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {f.icon}
              </span>
              <div className="min-w-0">
                <h3 className="text-[19px] font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
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
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", color: "#000000" }}>
                Hyper space
              </span>
              .
            </h2>
            <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-[1.6] text-muted-foreground">
              See how Hyper space turns listing photos into cinematic walkthroughs. Pick a template, choose your photos, and generate.
            </p>
            <div className="mx-auto mt-9 flex flex-col items-center justify-center">
              <Link
                to="/studio"
                data-cursor="hover"
                className="btn-glow-effect group inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full px-8 text-[14.5px] font-medium transition-all duration-300 hover:scale-105"
              >
                Get my free video
              </Link>
              <p className="mt-3 text-[12.5px] text-muted-foreground text-center">
                No credit card required
              </p>
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

        <div className="reveal relative mx-auto mt-12 w-full max-w-[900px] sm:mt-16">
          <div
            className="relative grid grid-cols-[1.25fr_1fr_1.1fr] items-center text-[12px] sm:grid-cols-[1.3fr_1fr_1.1fr] sm:text-[14.5px]"
            style={{ gridTemplateRows: "repeat(8, auto)" }}
          >
            {/* Raised highlight card spanning third column */}
            <div
              style={{ gridColumn: "3 / 4", gridRow: "1 / -1" }}
              className="pointer-events-none -my-3 rounded-[20px] border border-primary/20 bg-white shadow-[0_20px_60px_-30px_rgba(109,94,248,0.35)] z-0"
              aria-hidden="true"
            />

            {/* Table Header */}
            <div className="px-2 py-3 sm:px-4 sm:py-4" />
            <div className="break-words px-2 py-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:px-4 sm:py-4 sm:text-[12px]">
              Traditional videographer
            </div>
            <div className="relative z-[1] break-words px-2 py-3 text-center text-[15px] font-semibold text-foreground sm:px-4 sm:py-4 sm:text-[18px]">
              HyperSpace
            </div>

            {/* Rows */}
            {COMPARISON_ROWS.map((row) => (
              <Fragment key={row.label}>
                <div className="break-words border-t border-border px-2 py-3.5 text-left font-normal text-muted-foreground sm:px-4 sm:py-4">
                  {row.label}
                </div>
                <div className="flex break-words items-center justify-center border-t border-border px-2 py-3.5 text-center text-muted-foreground sm:px-4 sm:py-4">
                  {row.traditional === "check" ? (
                    <Check className="h-4 w-4 stroke-[2.5] text-muted-foreground" />
                  ) : row.traditional === "x" ? (
                    <X className="h-4 w-4 stroke-[2.5] text-muted-foreground" />
                  ) : row.traditionalStrike ? (
                    <span className="line-through opacity-75">{row.traditional}</span>
                  ) : (
                    row.traditional
                  )}
                </div>
                <div className="relative z-[1] flex break-words items-center justify-center border-t border-border/50 px-2 py-3.5 text-center font-medium text-foreground sm:px-4 sm:py-4">
                  {row.hyperspace === "check" ? (
                    <Check className="h-4 w-4 stroke-[2.5] text-primary" />
                  ) : row.hyperspace === "x" ? (
                    <X className="h-4 w-4 stroke-[2.5] text-muted-foreground" />
                  ) : (
                    row.hyperspace
                  )}
                </div>
              </Fragment>
            ))}
          </div>

          <p className="mt-8 text-center text-[12px] text-muted-foreground sm:text-[13px]">
            Based on average videographer rates of $500-1,200 per property video
          </p>

          <div className="mt-4 flex justify-center">
            <Link
              to="/studio"
              data-cursor="hover"
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-primary transition-opacity hover:opacity-80"
            >
              Try it on your next listing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
