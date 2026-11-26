import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
  Sparkles,
  Upload,
  Film,
  X,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize,
  Minimize,
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
  EarlyAccessButton,
} from "../components/site-chrome";
import { VIDEO_BASE_URL } from "../lib/videos";
import { type Template, TEMPLATE_CONFIG, TEMPLATES } from "../lib/templates";
import { useHoverVideo } from "../lib/use-hover-video";

export const Route = createFileRoute("/studio")({
  validateSearch: (search: Record<string, unknown>) => ({
    template: typeof search.template === "string" ? search.template : undefined,
  }),
  head: () => ({
    meta: [{ title: "Studio — Hyperspace" }],
  }),
  component: StudioPage,
});

const RESULT_VIDEO_SRC = `${VIDEO_BASE_URL}/template-06.mp4`;
const MAX_PHOTOS = 6;
const GENERATION_MS = 8000;
const VIDEO_SECONDS = 15;
const VIDEO_FIT: "blur" | "cover" = "cover";

const TEMPLATE_FOCUS: Record<string, string> = {
  "template-01": "center",
  "template-02": "center",
  "template-03": "center",
  "template-04": "center",
  "template-05": "center",
  "template-06": "center",
  "template-07": "center",
  "template-08": "center",
  "template-09": "center",
  "template-10": "center",
  "template-11": "center",
  "template-12": "center",
  "template-13": "center",
  "template-14": "center",
  "template-15": "center",
  "template-16": "center",
  "template-17": "center",
  "template-18": "center",
  "template-19": "center",
  "template-20": "center",
};

// Slot assignments for the 4x5 construction magazine grid
const SLOT_BY_TEMPLATE: Record<string, { slot: string; type: "portrait" | "landscape" }> = {
  "template-07": { slot: "slot-p1", type: "portrait" },
  "template-08": { slot: "slot-p2", type: "portrait" },
  "template-09": { slot: "slot-p3", type: "portrait" },
  "template-10": { slot: "slot-l1", type: "landscape" },
  "template-11": { slot: "slot-l2", type: "landscape" },
  "template-12": { slot: "slot-l3", type: "landscape" },
  "template-13": { slot: "slot-p4", type: "portrait" },
  "template-14": { slot: "slot-l4", type: "landscape" },
  "template-15": { slot: "slot-l5", type: "landscape" },
  "template-16": { slot: "slot-l6", type: "landscape" },
  "template-17": { slot: "slot-l7", type: "landscape" },
  "template-18": { slot: "slot-l8", type: "landscape" },
  "template-19": { slot: "slot-l9", type: "landscape" },
  "template-20": { slot: "slot-l10", type: "landscape" },
};

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "cinematic", label: "Cinematic Walkthrough" },
  { id: "construction", label: "Construction Walkthrough" },
] as const;

const QUALITIES = ["480p", "720p", "1080p"] as const;

const SHAPES = [
  { id: "16:9", label: "16:9", name: "Landscape" },
  { id: "9:16", label: "9:16", name: "Vertical" },
  { id: "1:1", label: "1:1", name: "Square" },
] as const;

const STATUS_MESSAGES = [
  "Reading your photos...",
  "Matching camera moves to each room...",
  "Applying the cinematic template...",
  "Rendering frames...",
  "Finalizing your walkthrough...",
];

interface UploadedPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

function StudioPage() {
  const scrolled = useScrolled();
  useRevealOnScroll();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    () => (search.template && TEMPLATES.some((t) => t.id === search.template) ? search.template : null),
  );

  const step2Ref = useRef<HTMLDivElement>(null);

  // Position at Step 2 before first paint if template was specified in search; otherwise instant scroll to top
  useLayoutEffect(() => {
    if (search.template && TEMPLATES.some((t) => t.id === search.template)) {
      step2Ref.current?.scrollIntoView({ behavior: "auto", block: "start" });
      navigate({ to: "/studio", search: {}, replace: true });
    } else {
      const prevBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.style.scrollBehavior = prevBehavior;
    }
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedQuality, setSelectedQuality] = useState<string>("1080p");
  const [selectedShape, setSelectedShape] = useState<string>("16:9");
  const [audioId, setAudioId] = useState<string | null>(null);
  const [isResultAudioOn, setIsResultAudioOn] = useState(true);

  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [stage, setStage] = useState<"idle" | "generating" | "generated">("idle");
  const [progress, setProgress] = useState(0);
  const [statusStep, setStatusStep] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<UploadedPhoto[]>([]);
  photosRef.current = uploadedPhotos;

  const isLocked = stage === "generating" || stage === "generated";
  const selectedTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) || null;

  const handleSelectTemplate = (id: string) => {
    if (isLocked) return;
    if (id === selectedTemplateId) return;

    setSelectedTemplateId(id);

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        step2Ref.current?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    });
  };

  // Template grouping
  const cinematicTemplates = TEMPLATES.filter((t) => t.category === "cinematic");
  const constructionTemplates = TEMPLATES.filter((t) => t.category === "construction");

  const visibleGroups =
    selectedCategory === "all"
      ? [
          { id: "cinematic", title: "Cinematic Walkthrough", templates: cinematicTemplates },
          { id: "construction", title: "Construction Walkthrough", templates: constructionTemplates },
        ]
      : selectedCategory === "cinematic"
        ? [{ id: "cinematic", title: "Cinematic Walkthrough", templates: cinematicTemplates }]
        : [{ id: "construction", title: "Construction Walkthrough", templates: constructionTemplates }];

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleFiles = (fileList: FileList | File[]) => {
    if (isLocked) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    setUploadedPhotos((prev) => {
      const totalCount = prev.length + files.length;
      if (totalCount > MAX_PHOTOS) {
        setUploadNotice("You can add up to 6 photos.");
      } else {
        setUploadNotice(null);
      }
      const availableSlots = Math.max(0, MAX_PHOTOS - prev.length);
      const toAdd = files.slice(0, availableSlots).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...toAdd];
    });
  };

  const handleRemovePhoto = (id: string) => {
    if (isLocked) return;
    setUploadedPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const next = prev.filter((p) => p.id !== id);
      if (next.length <= MAX_PHOTOS) {
        setUploadNotice(null);
      }
      return next;
    });
  };

  const handleMovePhoto = (index: number, delta: number) => {
    if (isLocked) return;
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= uploadedPhotos.length) return;
    setUploadedPhotos((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const handleClearAll = () => {
    if (isLocked) return;
    uploadedPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setUploadedPhotos([]);
    setUploadNotice(null);
  };

  // In development, log template video ratios, slot ratios, and percent cropped
  useEffect(() => {
    if (import.meta.env.DEV) {
      const realRatios: Record<string, number> = {
        "template-01": 1.7778, "template-02": 1.7778, "template-03": 1.7778,
        "template-04": 1.7778, "template-05": 1.7778, "template-06": 1.7778,
        "template-07": 0.5741, "template-08": 0.5741, "template-09": 0.5741,
        "template-10": 1.7419, "template-11": 1.7419, "template-12": 1.7419,
        "template-13": 0.5741, "template-14": 1.7419, "template-15": 1.7419,
        "template-16": 1.7778, "template-17": 1.7772, "template-18": 1.7419,
        "template-19": 1.7419, "template-20": 1.7419,
      };

      const rows = TEMPLATES.map((tpl) => {
        const Rv = realRatios[tpl.id] || (tpl.orientation === "portrait" ? 0.5741 : 1.7778);
        let slotRatio = 1.7778;
        if (tpl.category === "cinematic") {
          const num = parseInt(tpl.id.replace("template-", ""), 10);
          slotRatio = (num === 1 || num === 4) ? 2.9 : (num === 2 || num === 3) ? 1.45 : 2.18;
        } else {
          const slot = SLOT_BY_TEMPLATE[tpl.id]?.slot;
          if (slot?.startsWith("slot-p")) {
            slotRatio = 0.7153;
          } else if (slot === "slot-l1" || slot === "slot-l7") {
            slotRatio = 3.0231;
          } else {
            slotRatio = 1.4782;
          }
        }
        const crop = Rv > slotRatio ? (1 - slotRatio / Rv) * 100 : (1 - Rv / slotRatio) * 100;
        return {
          Template: tpl.id,
          "Real Ratio": Number(Rv.toFixed(3)),
          "Slot Ratio": Number(slotRatio.toFixed(3)),
          "Crop %": `${crop.toFixed(1)}%`,
        };
      });
      console.table(rows);
    }
  }, []);

  // Generation flow disabled: Generate button now opens Tally form. Kept for later re-enabling:
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGenerate = () => {
    if (!selectedTemplateId || uploadedPhotos.length === 0 || stage !== "idle") return;

    setAudioId(null);
    setStage("generating");
    setProgress(0);
    setStatusStep(0);

    previewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / GENERATION_MS) * 100));
      setProgress(pct);

      const stepIdx = Math.min(
        STATUS_MESSAGES.length - 1,
        Math.floor((pct / 100) * STATUS_MESSAGES.length)
      );
      setStatusStep(stepIdx);

      if (elapsed >= GENERATION_MS) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setProgress(100);
        setIsResultAudioOn(true);
        setStage("generated");
      }
    }, 100);
  };

  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStage("idle");
    setSelectedTemplateId(null);
    setSelectedCategory("all");
    setSelectedQuality("1080p");
    setSelectedShape("16:9");
    setAudioId(null);
    setIsResultAudioOn(true);
    uploadedPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setUploadedPhotos([]);
    setUploadNotice(null);
    setProgress(0);
    setStatusStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /*
  const handleApplyAccess = () => {
    const win = window as unknown as {
      Tally?: {
        openPopup: (id: string, options: { layout: string; width: number }) => void;
      };
    };
    if (win.Tally) {
      win.Tally.openPopup(ACCESS_FORM_ID, { layout: "modal", width: 700 });
    } else {
      window.open(`https://tally.so/r/${ACCESS_FORM_ID}`, "_blank");
    }
  };
  */

  const previewShapeClass =
    selectedShape === "9:16"
      ? "aspect-[9/16] w-full max-w-[340px] mx-auto"
      : selectedShape === "1:1"
        ? "aspect-square w-full max-w-[520px] mx-auto"
        : "aspect-video w-full max-w-[860px] mx-auto";

  return (
    <div className="page-enter relative min-h-screen overflow-x-clip bg-background text-foreground">
      <style>{`
/* CINEMATIC WALKTHROUGH: asymmetric editorial, 6 columns (4+2, 2+4, 3+3) */
.gallery-cinematic { display: grid; grid-template-columns: repeat(6, 1fr); gap: 21px; }
.gallery-cinematic .tpl-card { position: relative; height: 270px; border-radius: 19px; }
.gallery-cinematic .tpl-card:nth-child(1) { grid-column: span 4; }
.gallery-cinematic .tpl-card:nth-child(2) { grid-column: span 2; }
.gallery-cinematic .tpl-card:nth-child(3) { grid-column: span 2; }
.gallery-cinematic .tpl-card:nth-child(4) { grid-column: span 4; }
.gallery-cinematic .tpl-card:nth-child(5) { grid-column: span 3; }
.gallery-cinematic .tpl-card:nth-child(6) { grid-column: span 3; }
@media (max-width: 768px) {
  .gallery-cinematic { grid-template-columns: 1fr; }
  .gallery-cinematic .tpl-card { grid-column: span 1 !important; height: auto; aspect-ratio: 16 / 10; }
}

/* CONSTRUCTION WALKTHROUGH: editorial magazine, 4 columns x 5 rows */
.gallery-construction { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 195px; gap: 13px; }
.gallery-construction .tpl-card { position: relative; border-radius: 14px; }
.gallery-construction .slot-p1  { grid-column: 1 / span 1; grid-row: 1 / span 2; }
.gallery-construction .slot-l1  { grid-column: 2 / span 2; grid-row: 1 / span 1; }
.gallery-construction .slot-l2  { grid-column: 4 / span 1; grid-row: 1 / span 1; }
.gallery-construction .slot-l3  { grid-column: 2 / span 1; grid-row: 2 / span 1; }
.gallery-construction .slot-l4  { grid-column: 3 / span 1; grid-row: 2 / span 1; }
.gallery-construction .slot-p2  { grid-column: 4 / span 1; grid-row: 2 / span 2; }
.gallery-construction .slot-l5  { grid-column: 1 / span 1; grid-row: 3 / span 1; }
.gallery-construction .slot-p3  { grid-column: 2 / span 1; grid-row: 3 / span 2; }
.gallery-construction .slot-l6  { grid-column: 3 / span 1; grid-row: 3 / span 1; }
.gallery-construction .slot-p4  { grid-column: 1 / span 1; grid-row: 4 / span 2; }
.gallery-construction .slot-l7  { grid-column: 3 / span 2; grid-row: 4 / span 1; }
.gallery-construction .slot-l8  { grid-column: 2 / span 1; grid-row: 5 / span 1; }
.gallery-construction .slot-l9  { grid-column: 3 / span 1; grid-row: 5 / span 1; }
.gallery-construction .slot-l10 { grid-column: 4 / span 1; grid-row: 5 / span 1; }
@media (max-width: 768px) {
  .gallery-construction { grid-template-columns: repeat(2, 1fr); grid-auto-rows: auto; }
  .gallery-construction .tpl-card { grid-column: auto !important; grid-row: auto !important; }
  .gallery-construction .tpl-card[data-type="landscape"] { grid-column: span 2 !important; aspect-ratio: 16 / 10; }
  .gallery-construction .tpl-card[data-type="portrait"] { grid-column: span 1 !important; aspect-ratio: 3 / 4; }
}

@media (hover: hover) {
  .gallery-cinematic:hover .tpl-card,
  .gallery-construction:hover .tpl-card { opacity: 0.4; transition: opacity 0.3s ease, transform 0.3s ease; }
  .gallery-cinematic .tpl-card:hover,
  .gallery-construction .tpl-card:hover { opacity: 1; transform: scale(1.015); }
}

@keyframes glow-pulse {
  0%, 100% { transform: scale(1); opacity: 0.32; }
  50% { transform: scale(1.02); opacity: 0.26; }
}
.animate-glow-pulse {
  animation: glow-pulse 3s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .animate-glow-pulse {
    animation: none !important;
  }
}
      `}</style>
      <HalftoneBackground />
      <AmbientGlows />
      <CursorTrail />

      <Nav scrolled={scrolled} showCta={true} />

      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 mx-auto w-full max-w-[1240px] px-4 sm:px-6 pt-10 sm:pt-14 pb-24"
      >
        {/* Header */}
        <div>
          <Link
            to="/"
            data-cursor="hover"
            className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>

          <div className="mt-5">
            <Badge>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Hyperspace Studio
            </Badge>
          </div>

          <h1 className="mt-4 text-[17px] sm:text-[19px] sm:whitespace-nowrap md:text-[24px] lg:text-[32px] xl:text-[38px] font-semibold leading-[1.08] tracking-[-0.025em]">
            Pick a cinematic style, upload up to 6 photos, and generate.
          </h1>
        </div>

        {/* STEP 1: Choose a template (Full Width) */}
        <div className="mt-10 rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">
            Step 1
          </span>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
            Choose a template
          </h2>

          {/* Category Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                disabled={isLocked}
                onClick={() => setSelectedCategory(cat.id)}
                data-cursor="hover"
                className={`rounded-full px-4 py-1.5 text-[12.5px] sm:text-[13px] font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-sm"
                    : "border border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground"
                } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grouped Galleries */}
          <div className="mt-6 flex flex-col gap-12">
            {(selectedCategory === "all" || selectedCategory === "cinematic") && (
              <div>
                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-4">
                  <span className="text-[12px] font-normal uppercase tracking-[0.18em] text-black">
                    Cinematic Walkthrough
                  </span>
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {cinematicTemplates.length} templates
                  </span>
                </div>

                <div className="gallery-cinematic">
                  {cinematicTemplates.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      dataType="landscape"
                      isSelected={tpl.id === selectedTemplateId}
                      isAudioOn={audioId === tpl.id}
                      onToggleAudio={() =>
                        setAudioId((prev) => (prev === tpl.id ? null : tpl.id))
                      }
                      isDisabled={isLocked}
                      onSelect={() => handleSelectTemplate(tpl.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {(selectedCategory === "all" || selectedCategory === "construction") && (
              <div>
                <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-4">
                  <span className="text-[12px] font-normal uppercase tracking-[0.18em] text-black">
                    Construction Walkthrough
                  </span>
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {constructionTemplates.length} templates
                  </span>
                </div>

                <div className="gallery-construction">
                  {constructionTemplates.map((tpl) => {
                    const slotInfo = SLOT_BY_TEMPLATE[tpl.id] || { slot: "", type: tpl.orientation };
                    return (
                      <TemplateCard
                        key={tpl.id}
                        template={tpl}
                        slotClass={slotInfo.slot}
                        dataType={slotInfo.type}
                        isSelected={tpl.id === selectedTemplateId}
                        isAudioOn={audioId === tpl.id}
                        onToggleAudio={() =>
                          setAudioId((prev) => (prev === tpl.id ? null : tpl.id))
                        }
                        isDisabled={isLocked}
                        onSelect={() => handleSelectTemplate(tpl.id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lower Section: Step 2 & Step 3 Side-by-Side Row */}
        <div className="mt-10 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
          {/* STEP 2: Upload your photos */}
          <div
            ref={step2Ref}
            className="scroll-mt-24 min-h-[300px] flex flex-col rounded-[24px] border border-border bg-white p-6 md:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">
                  Step 2
                </span>
                <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
                  Upload your photos
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {uploadedPhotos.length > 0 && !isLocked && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    data-cursor="hover"
                    className="text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-red-500"
                  >
                    Clear all
                  </button>
                )}
                <span className="text-[12.5px] font-semibold text-muted-foreground">
                  {uploadedPhotos.length} / {MAX_PHOTOS} photos
                </span>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!isLocked) setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (!isLocked && e.dataTransfer.files) {
                  handleFiles(e.dataTransfer.files);
                }
              }}
              onClick={() => {
                if (!isLocked) fileInputRef.current?.click();
              }}
              data-cursor="hover"
              className={`mt-5 flex flex-1 min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all duration-200 ${
                isLocked
                  ? "border-border/60 bg-neutral-50/50 opacity-60 cursor-not-allowed"
                  : isDragOver
                    ? "border-primary bg-primary/[0.04] scale-[0.99] cursor-pointer"
                    : "border-border hover:border-primary/50 hover:bg-neutral-50/60 cursor-pointer"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                disabled={isLocked}
                onChange={(e) => {
                  if (e.target.files) {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }
                }}
                className="hidden"
              />
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </div>
              <p className="mt-3 text-[14px] font-semibold text-foreground">
                Drag and drop photos here, or click to browse
              </p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Up to 6 photos · JPG, PNG, WEBP
              </p>
            </div>

            {uploadNotice && (
              <p className="mt-2 text-[12.5px] font-medium text-amber-600">
                {uploadNotice}
              </p>
            )}

            {/* Thumbnails reorder row */}
            {uploadedPhotos.length > 0 && (
              <Reorder.Group
                axis="x"
                values={uploadedPhotos}
                onReorder={isLocked ? () => {} : setUploadedPhotos}
                className="mt-4 flex gap-3 overflow-x-auto pb-2 pt-1 select-none"
              >
                {uploadedPhotos.map((photo, index) => (
                  <Reorder.Item
                    key={photo.id}
                    value={photo}
                    dragListener={!isLocked}
                    whileDrag={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.25)" }}
                    className={`group relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-neutral-100 shadow-sm sm:h-32 sm:w-32 ${
                      isLocked ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                    }`}
                  >
                    <img
                      src={photo.previewUrl}
                      alt={`Upload ${index + 1}`}
                      className="pointer-events-none h-full w-full object-cover"
                    />
                    {/* Order number badge */}
                    <span className="pointer-events-none absolute top-1.5 left-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-white text-[11px] font-bold shadow">
                      {index + 1}
                    </span>
                    {/* Remove button */}
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(photo.id);
                        }}
                        data-cursor="hover"
                        className="absolute top-1.5 right-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-black transition-colors shadow z-10"
                        title="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {/* Fallback shift buttons */}
                    {!isLocked && (
                      <div className="absolute inset-x-1 bottom-1.5 flex items-center justify-between pointer-events-none z-10">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePhoto(index, -1);
                          }}
                          title="Move left"
                          className="pointer-events-auto grid h-6 w-6 place-items-center rounded-md bg-black/70 text-white hover:bg-black transition-opacity disabled:opacity-30 disabled:pointer-events-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === uploadedPhotos.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMovePhoto(index, 1);
                          }}
                          title="Move right"
                          className="pointer-events-auto grid h-6 w-6 place-items-center rounded-md bg-black/70 text-white hover:bg-black transition-opacity disabled:opacity-30 disabled:pointer-events-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>

          {/* STEP 3: Generate */}
          <div className="flex flex-col items-start rounded-[24px] border border-border bg-white p-6 md:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.03)] text-left">
            <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-primary">
              Step 3
            </span>
            <h2 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
              Generate
            </h2>

            <div className="mt-5 grid w-full grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {/* Quality Group */}
              <div className="flex flex-col items-start w-full">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Quality
                </span>
                <div className="mt-2.5 grid w-full grid-cols-3 gap-2">
                  {QUALITIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setSelectedQuality(q)}
                      data-cursor="hover"
                      className={`h-11 rounded-xl border py-2 text-center text-[13px] font-medium transition-all ${
                        selectedQuality === q
                          ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                          : "border-border bg-white text-foreground hover:border-primary/30"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shape Group */}
              <div className="flex flex-col items-start w-full">
                <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Shape
                </span>
                <div className="mt-2.5 grid w-full grid-cols-3 gap-2">
                  {SHAPES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setSelectedShape(s.id)}
                      data-cursor="hover"
                      className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-center transition-all ${
                        selectedShape === s.id
                          ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                          : "border-border bg-white text-foreground hover:border-primary/30"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {s.id === "16:9" && (
                        <span className="block h-3.5 w-6 rounded-[2px] border-2 border-current shrink-0" />
                      )}
                      {s.id === "9:16" && (
                        <span className="block h-5 w-3.5 rounded-[2px] border-2 border-current shrink-0" />
                      )}
                      {s.id === "1:1" && (
                        <span className="block h-4 w-4 rounded-[2px] border-2 border-current shrink-0" />
                      )}
                      <span className="text-[12px] font-semibold">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Details Box */}
            <div className="mt-6 w-full rounded-2xl border border-border bg-neutral-50/70 p-5 text-left">
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Details
              </h4>
              <div className="mt-3 divide-y divide-border/60 text-[13.5px]">
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Template</span>
                  <span className="font-medium text-foreground">
                    {selectedTemplate ? selectedTemplate.name : "Not selected yet"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium text-foreground">
                    {selectedTemplate
                      ? selectedTemplate.category === "cinematic"
                        ? "Cinematic Walkthrough"
                        : "Construction Walkthrough"
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Quality</span>
                  <span className="font-medium text-foreground">{selectedQuality}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Shape</span>
                  <span className="font-medium text-foreground">
                    {selectedShape} (
                    {SHAPES.find((s) => s.id === selectedShape)?.name})
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium text-foreground">{VIDEO_SECONDS} sec</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Photos</span>
                  <span className="font-medium text-foreground">
                    {uploadedPhotos.length} / {MAX_PHOTOS}
                  </span>
                </div>
              </div>
            </div>

            {/* Generate Button & helper text */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <EarlyAccessButton />
              <span className="text-[13.5px] text-muted-foreground font-medium">
                {!selectedTemplateId
                  ? "Select a template to continue."
                  : uploadedPhotos.length === 0
                    ? ""
                    : `${selectedTemplate?.name} · ${uploadedPhotos.length} photo${uploadedPhotos.length === 1 ? "" : "s"}`}
              </span>
            </div>
          </div>
        </div>

        {/* Full-width Centered Preview Section Below */}
        <div ref={previewPanelRef} className="mt-10 rounded-[24px] border border-border bg-white p-6 md:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
              Preview
            </h2>
          </div>

          {/* Preview Frame matching selected Shape */}
          <div
            className={`relative overflow-hidden rounded-[20px] bg-neutral-200 flex flex-col items-center justify-center shadow-inner transition-all duration-300 ${previewShapeClass}`}
          >
            {/* State 1: No template selected */}
            {!selectedTemplate && stage === "idle" && (
              <div className="flex flex-col items-center justify-center gap-3 text-center px-4 py-20">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black/5 text-neutral-400">
                  <Film className="h-6 w-6" />
                </div>
                <p className="text-[13px] text-neutral-500 font-medium">
                  Select a template to preview
                </p>
              </div>
            )}

            {/* State 2: Template selected and idle */}
            {selectedTemplate && stage === "idle" && (
              <AnimatePresence mode="sync">
                <motion.div
                  key={selectedTemplate.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 h-full w-full"
                >
                  <FitVideo
                    src={selectedTemplate.videoSrc}
                    playing={true}
                    soundOn={false}
                    loop={true}
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur whitespace-nowrap shadow-sm z-10 pointer-events-none">
                    {selectedTemplate.name}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* State 3: Generating */}
            {stage === "generating" && (
              <div className="flex flex-col items-center justify-center p-6 text-center text-foreground w-full">
                {/* Spinning conic-gradient ring */}
                <div className="relative flex h-24 w-24 items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full animate-spin-slow"
                    style={{
                      background:
                        "conic-gradient(from 0deg, #6D5EF8, #8B7CFF, transparent 60%)",
                      padding: "3px",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "exclude",
                      WebkitMaskComposite: "destination-out",
                    }}
                  />
                  <div className="absolute inset-2 animate-pulse rounded-full bg-[#6D5EF8]/10" />
                  <span className="text-xl font-bold tracking-tight text-neutral-900">{progress}%</span>
                </div>

                {/* Progress track & dynamic status */}
                <div className="mt-6 w-full max-w-[200px] text-center">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-300">
                    <div
                      className="h-full bg-gradient-to-r from-primary via-primary-soft to-[#8B7CFF] transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-3 min-h-[36px] flex items-center justify-center text-[12px] text-neutral-600 italic leading-snug">
                    {STATUS_MESSAGES[statusStep]}
                  </p>
                </div>
              </div>
            )}

            {/* State 4: Generated Result with Custom VideoPlayer */}
            {stage === "generated" && (
              <VideoPlayer
                src={RESULT_VIDEO_SRC}
                onReset={handleReset}
              />
            )}
          </div>

          {/* Output specification text label under preview */}
          <p className="mt-4 text-center text-[12.5px] font-medium text-muted-foreground">
            {stage === "generated" && selectedTemplate
              ? `${selectedTemplate.name} · Output: ${selectedShape} · ${selectedQuality}`
              : `Output: ${selectedShape} · ${selectedQuality}`}
          </p>

          {/* Reset button when generated */}
          {stage === "generated" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6 border-t border-border pt-5 flex justify-center"
            >
              <button
                type="button"
                onClick={handleReset}
                data-cursor="hover"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-white px-5 text-[13px] font-medium text-muted-foreground transition-all duration-200 hover:bg-neutral-50 hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Try another template</span>
              </button>
            </motion.div>
          )}
        </div>
      </motion.main>

      <Footer />
    </div>
  );
}

function VideoPlayer({
  src,
  onReset,
}: {
  src: string;
  onReset: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isEnded, setIsEnded] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-play on mount with sound fallback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !soundOn;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // If browser rejected unmuted autoplay, fall back to muted
          video.muted = true;
          setSoundOn(false);
          video.play().catch(() => {});
          setIsPlaying(true);
        });
    }
  }, []);

  // Sync soundOn
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !soundOn;
  }, [soundOn]);

  // Track Fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Controls auto-hide timer (2.5 seconds inactivity while playing)
  const resetControlsTimer = () => {
    setShowControls(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    if (isPlaying && !isEnded) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  useEffect(() => {
    if (!isPlaying || isEnded) {
      setShowControls(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    } else {
      resetControlsTimer();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, isEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isEnded) {
      video.currentTime = 0;
      setIsEnded(false);
      video.play().catch(() => {});
      setIsPlaying(true);
      return;
    }

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
    setShowControls(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
    if (isEnded) setIsEnded(false);
  };

  const toggleMute = () => {
    setSoundOn((prev) => !prev);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((video as unknown as { webkitEnterFullscreen?: () => void })?.webkitEnterFullscreen) {
        (video as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const video = videoRef.current;
      if (video) {
        video.currentTime = Math.max(0, video.currentTime - 5);
        setCurrentTime(video.currentTime);
      }
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      const video = videoRef.current;
      if (video) {
        video.currentTime = Math.min(duration || 100, video.currentTime + 5);
        setCurrentTime(video.currentTime);
      }
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      toggleMute();
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      toggleFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Result Video Player"
      onKeyDown={handleKeyDown}
      onMouseMove={resetControlsTimer}
      onClick={togglePlay}
      className="group relative h-full w-full overflow-hidden bg-black select-none focus:outline-none"
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        className="h-full w-full object-cover"
      />

      {/* Center Action Overlay: Play when paused, or Replay when ended */}
      {!isPlaying && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[1px] transition-opacity duration-200">
          {isEnded ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              data-cursor="hover"
              aria-label="Replay video"
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Replay</span>
            </button>
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full bg-black/60 backdrop-blur border border-white/20 text-white shadow-2xl transition-transform hover:scale-110">
              <Play className="h-7 w-7 fill-white translate-x-0.5" />
            </div>
          )}
        </div>
      )}

      {/* Overlaid Custom Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-x-0 bottom-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-3.5 pt-12 transition-opacity duration-300 ${
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div className="relative mb-3 flex items-center group/scrubber">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Seek progress"
            className="w-full cursor-pointer appearance-none bg-transparent h-1.5 focus:outline-none"
          />
          {/* Custom Track Background */}
          <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-75"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-[12px] font-medium">
          {/* Left Controls: Play/Pause, Sound, Time */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              data-cursor="hover"
              aria-label={isPlaying ? "Pause" : "Play"}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-white" />
              ) : (
                <Play className="h-4 w-4 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              data-cursor="hover"
              aria-label={soundOn ? "Mute" : "Unmute"}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              {soundOn ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-white/70" />
              )}
            </button>

            <span className="tabular-nums text-white/80 text-[11.5px] ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFullscreen}
              data-cursor="hover"
              aria-label={isFullscreen ? "Exit Fullscreen" : "View in max size"}
              title={isFullscreen ? "Exit Fullscreen" : "View in max size"}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FitVideo({
  src,
  videoRef,
  soundOn = false,
  loop = true,
  focus = "center",
  className = "",
  preload = "metadata",
}: {
  src: string;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  soundOn?: boolean;
  loop?: boolean;
  focus?: string;
  className?: string;
  preload?: "metadata" | "auto" | "none";
}) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (hasError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-200 p-4 text-center">
        <Film className="h-8 w-8 text-neutral-400" />
        <span className="text-[11px] text-neutral-500 font-medium">Preview unavailable</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={`${src}#t=0.1`}
      preload={preload}
      playsInline
      loop={loop}
      muted={!soundOn}
      onLoadedData={() => setLoaded(true)}
      onError={() => setHasError(true)}
      className={`absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
      style={{ objectPosition: focus }}
    />
  );
}

function TemplateCard({
  template,
  slotClass = "",
  dataType = "landscape",
  isSelected,
  isAudioOn,
  onToggleAudio,
  isDisabled,
  onSelect,
}: {
  template: Template;
  slotClass?: string;
  dataType?: "portrait" | "landscape";
  isSelected: boolean;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  isDisabled: boolean;
  onSelect: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const { isHovered, onPointerEnter, onPointerLeave, onClick } = useHoverVideo({
    videoRef,
    soundOn: isAudioOn,
  });

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (isDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    onPointerEnter(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    onPointerLeave(e);
  };

  const focus = TEMPLATE_FOCUS[template.id] || "center";

  return (
    <div
      tabIndex={0}
      data-type={dataType}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      data-cursor="hover"
      style={
        {
          "--mx": `${mousePos.x}px`,
          "--my": `${mousePos.y}px`,
        } as React.CSSProperties
      }
      className={`tpl-card group relative isolate rounded-[inherit] select-none focus-visible:outline-none ${slotClass} ${
        isHovered && !isDisabled ? "z-10" : "z-0"
      }`}
    >
      {/* Outer Glow Element (outside the frame) */}
      <div
        aria-hidden="true"
        className={`absolute -inset-1.5 -z-10 rounded-[inherit] blur-lg pointer-events-none transition-opacity duration-300 ease-out will-change-[transform,opacity] ${
          isDisabled
            ? "opacity-0"
            : isSelected
              ? "opacity-[0.24]"
              : isHovered
                ? "opacity-[0.14]"
                : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(220px circle at var(--mx, 50%) var(--my, 50%), rgba(169,156,255,0.5), rgba(169,156,255,0.15) 50%, transparent 70%)",
        }}
      />

      {/* Inner Frame (contains video and overlays, clips corners) */}
      <div
        className={`absolute inset-0 rounded-[inherit] overflow-hidden bg-neutral-200 border transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-primary ${
          isSelected
            ? "border-primary ring-2 ring-primary/70 shadow-[0_0_20px_-4px_rgba(169,156,255,0.4)]"
            : isDisabled
              ? "border-black/10"
              : "border-black/10 hover:border-primary/40 hover:shadow-[0_8px_24px_-8px_rgba(169,156,255,0.25)]"
        }`}
      >
        <FitVideo
          videoRef={videoRef}
          src={template.videoSrc}
          soundOn={isAudioOn}
          loop={true}
          focus={focus}
          preload={isHovered || isSelected ? "auto" : "metadata"}
        />

        {/* TOP-RIGHT: Audio Toggle Button */}
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

        {/* BOTTOM ROW: Name Pill & Use this template button in ONE flex row */}
        <div className="card-bottom-row">
          <div className="card-pill">
            <span className="pill-full-name truncate">{template.name}</span>
            <span className="pill-short-name">{template.id.replace("template-", "")}</span>
          </div>

          <button
            type="button"
            disabled={isDisabled}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            data-cursor="hover"
            className={`card-use-btn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isSelected
                ? "bg-primary text-white"
                : "bg-white/90 text-neutral-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {isSelected ? (
              <>
                <Check className="h-3 w-3 stroke-[2.5]" />
                <span>In use</span>
              </>
            ) : (
              <>
                <span className="btn-full-label">Use this template</span>
                <span className="btn-short-label">Use</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
