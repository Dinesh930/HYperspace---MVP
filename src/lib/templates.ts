import { VIDEO_BASE_URL } from "./videos";

export interface Template {
  id: string;
  name: string;
  videoSrc: string;
  category: "cinematic" | "construction";
  orientation: "landscape" | "portrait";
}

export const TEMPLATE_CONFIG: Record<
  number,
  { category: "cinematic" | "construction"; orientation: "landscape" | "portrait" }
> = {
  1: { category: "cinematic", orientation: "landscape" },
  2: { category: "cinematic", orientation: "landscape" },
  3: { category: "cinematic", orientation: "landscape" },
  4: { category: "cinematic", orientation: "landscape" },
  5: { category: "cinematic", orientation: "landscape" },
  6: { category: "cinematic", orientation: "landscape" },
  7: { category: "construction", orientation: "portrait" },
  8: { category: "construction", orientation: "portrait" },
  9: { category: "construction", orientation: "portrait" },
  10: { category: "construction", orientation: "landscape" },
  11: { category: "construction", orientation: "landscape" },
  12: { category: "construction", orientation: "landscape" },
  13: { category: "construction", orientation: "portrait" },
  14: { category: "construction", orientation: "landscape" },
  15: { category: "construction", orientation: "landscape" },
  16: { category: "construction", orientation: "landscape" },
  17: { category: "construction", orientation: "landscape" },
  18: { category: "construction", orientation: "landscape" },
  19: { category: "construction", orientation: "landscape" },
  20: { category: "construction", orientation: "landscape" },
};

export const ALL_TEMPLATES: Template[] = Array.from({ length: 20 }, (_, i) => {
  const num = i + 1;
  const idNum = String(num).padStart(2, "0");
  const cfg = TEMPLATE_CONFIG[num];
  return {
    id: `template-${idNum}`,
    name: `Template ${idNum}`,
    videoSrc: `${VIDEO_BASE_URL}/template-${idNum}.mp4`,
    category: cfg.category,
    orientation: cfg.orientation,
  };
});

export const TEMPLATES: Template[] = ALL_TEMPLATES.filter((t) => t.id !== "template-06");
