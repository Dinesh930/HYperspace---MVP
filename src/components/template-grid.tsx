import { useEffect, useRef } from "react";
import { ALL_TEMPLATES, type Template } from "../lib/templates";

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

export function TemplateGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = buildGridItems();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target as HTMLElement;
          const video = card.querySelector<HTMLVideoElement>("video");
          if (!video) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            const videoSrc = card.getAttribute("data-src");
            if (videoSrc && !video.getAttribute("src")) {
              video.src = videoSrc;
              video.load();
            }
            if (!reducedMotion) {
              video.play().catch(() => {});
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.35 },
    );

    const cards = container.querySelectorAll(".video-card");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="video-grid reveal">
      {items.map(({ slot, template }) => (
        <div
          key={template.id}
          className={`video-card ${slot}`}
          data-type={template.orientation}
          data-src={template.videoSrc}
        >
          <video
            muted
            loop
            playsInline
            preload="none"
          />
          <span className="card-label">
            {template.name}
          </span>
        </div>
      ))}
    </div>
  );
}
