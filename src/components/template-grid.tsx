import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Volume2, VolumeX } from "lucide-react";
import { ALL_TEMPLATES, type Template } from "../lib/templates";
import { useHoverVideo } from "../lib/use-hover-video";

const PORTRAIT_IDS = ["template-07", "template-08", "template-09", "template-13"] as const;
const LANDSCAPE_IDS = [
  "template-01",
  "template-02",
  "template-03",
  "template-04",
  "template-05",
  "template-10",
  "template-11",
  "template-12",
  "template-14",
  "template-15",
  "template-16",
  "template-17",
  "template-18",
  "template-19",
  "template-20",
  "template-06",
] as const;

interface GridSlotItem {
  slot: string;
  template: Template;
}

function buildGridItems(): GridSlotItem[] {
  const map = new Map<string, Template>();
  ALL_TEMPLATES.forEach((t) => map.set(t.id, t));

  const items: GridSlotItem[] = [
    { slot: "slot-p1", template: map.get(PORTRAIT_IDS[0])! },
    { slot: "slot-l1", template: map.get(LANDSCAPE_IDS[0])! },
    { slot: "slot-l2", template: map.get(LANDSCAPE_IDS[1])! },
    { slot: "slot-l3", template: map.get(LANDSCAPE_IDS[2])! },
    { slot: "slot-l4", template: map.get(LANDSCAPE_IDS[3])! },
    { slot: "slot-l5", template: map.get(LANDSCAPE_IDS[4])! },
    { slot: "slot-p2", template: map.get(PORTRAIT_IDS[1])! },
    { slot: "slot-l6", template: map.get(LANDSCAPE_IDS[5])! },
    { slot: "slot-l7", template: map.get(LANDSCAPE_IDS[6])! },
    { slot: "slot-l8", template: map.get(LANDSCAPE_IDS[7])! },
    { slot: "slot-p3", template: map.get(PORTRAIT_IDS[2])! },
    { slot: "slot-l9", template: map.get(LANDSCAPE_IDS[8])! },
    { slot: "slot-l10", template: map.get(LANDSCAPE_IDS[9])! },
    { slot: "slot-l11", template: map.get(LANDSCAPE_IDS[10])! },
    { slot: "slot-l12", template: map.get(LANDSCAPE_IDS[11])! },
    { slot: "slot-l13", template: map.get(LANDSCAPE_IDS[12])! },
    { slot: "slot-p4", template: map.get(PORTRAIT_IDS[3])! },
    { slot: "slot-l14", template: map.get(LANDSCAPE_IDS[13])! },
    { slot: "slot-l15", template: map.get(LANDSCAPE_IDS[14])! },
    { slot: "slot-l16", template: map.get(LANDSCAPE_IDS[15])! },
  ];

  return items;
}

function GridCard({
  slot,
  template,
  index,
  isAudioOn,
  onToggleAudio,
}: {
  slot: string;
  template: Template;
  index: number;
  isAudioOn: boolean;
  onToggleAudio: () => void;
}) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const { onPointerEnter, onPointerLeave, onClick } = useHoverVideo({
    videoRef,
    soundOn: isAudioOn,
  });

  const handleUseTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({
      to: "/studio",
      search: { template: template.id },
    });
  };

  return (
    <div
      ref={cardRef}
      className={`video-card ${slot} group`}
      data-type={template.orientation}
      data-src={`${template.videoSrc}#t=0.1`}
      style={{ transitionDelay: `${Math.min(index, 8) * 60}ms` }}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        muted={!isAudioOn}
        loop
        playsInline
        preload="metadata"
        onLoadedData={() => setLoaded(true)}
        className={loaded ? "loaded" : ""}
      />

      {/* Top-Right Audio Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleAudio();
        }}
        data-cursor="hover"
        title={isAudioOn ? "Mute audio" : "Unmute audio"}
        className="card-audio-btn hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {isAudioOn ? (
          <Volume2 className="h-3.5 w-3.5" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 text-white/70" />
        )}
      </button>

      {/* Subtle Bottom Gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/45 to-transparent z-[1]" />

      {/* BOTTOM ROW: Name Pill & Use this template button */}
      <div className="card-bottom-row">
        <div className="card-pill">
          <span className="pill-full-name truncate">{template.name}</span>
          <span className="pill-short-name">{template.id.replace("template-", "")}</span>
        </div>

        <button
          type="button"
          onClick={handleUseTemplate}
          data-cursor="hover"
          className="card-use-btn bg-white/90 text-neutral-900 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="btn-full-label">Use this template</span>
          <span className="btn-short-label">Use</span>
        </button>
      </div>
    </div>
  );
}

export function TemplateGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [audioId, setAudioId] = useState<string | null>(null);
  const items = buildGridItems();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // IntersectionObserver ONLY to set src when within 200px of viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target as HTMLElement;
            const video = card.querySelector<HTMLVideoElement>("video");
            const src = card.getAttribute("data-src");
            if (video && src && !video.getAttribute("src")) {
              video.src = src;
              video.load();
            }
          }
        });
      },
      { rootMargin: "200px" },
    );

    const cards = container.querySelectorAll(".video-card");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="video-grid reveal">
      {items.map(({ slot, template }, index) => (
        <GridCard
          key={template.id}
          slot={slot}
          template={template}
          index={index}
          isAudioOn={audioId === template.id}
          onToggleAudio={() =>
            setAudioId((prev) => (prev === template.id ? null : template.id))
          }
        />
      ))}
    </div>
  );
}
