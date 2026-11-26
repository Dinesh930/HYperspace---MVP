import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
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
}: {
  slot: string;
  template: Template;
}) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const { onPointerEnter, onPointerLeave, onClick } = useHoverVideo({
    videoRef,
    soundOn: false,
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
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
      />
      {/* Subtle Bottom Gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black/45 to-transparent z-[1]" />

      {/* BOTTOM ROW: Name Pill & Use this template button */}
      <div className="absolute inset-x-2 bottom-2 z-10 flex items-center justify-between gap-2 sm:inset-x-2.5 sm:bottom-2.5">
        <div
          className={`min-w-0 truncate max-w-[55%] h-6 sm:h-7 px-2 sm:px-2.5 text-[10.5px] sm:text-[11.5px] font-semibold text-white bg-black/45 backdrop-blur rounded-full items-center shadow-sm pointer-events-none ${
            template.orientation === "portrait" ? "hidden sm:flex" : "flex"
          }`}
        >
          <span className="truncate">{template.name}</span>
        </div>

        <button
          type="button"
          onClick={handleUseTemplate}
          data-cursor="hover"
          className="shrink-0 whitespace-nowrap h-6 px-2.5 text-[10.5px] sm:h-7 sm:px-3 sm:text-[11.5px] gap-1 rounded-full font-semibold shadow-sm transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary inline-flex items-center justify-center bg-white/90 text-neutral-900 hover:bg-white"
        >
          {template.orientation === "portrait" ? (
            <>
              <span className="sm:hidden">Use</span>
              <span className="hidden sm:inline">Use this template</span>
            </>
          ) : (
            <span>Use this template</span>
          )}
        </button>
      </div>
    </div>
  );
}

export function TemplateGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
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
      {items.map(({ slot, template }) => (
        <GridCard key={template.id} slot={slot} template={template} />
      ))}
    </div>
  );
}
