"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PlaceholderAsset } from "@/components/asset-image";
import type { BenefitsImage } from "@/lib/cms/landing";

interface BenefitsCarouselProps {
  images: BenefitsImage[];
  alt: string;
}

const AUTO_SLIDE_INTERVAL = 6000;
/** ms to pause auto-slide after manual navigation before resuming */
const RESUME_DELAY = 10_000;

type State = {
  index: number;
  autoPlay: boolean;
};

type Action =
  | { type: "next"; total: number }
  | { type: "prev"; total: number }
  | { type: "jump"; index: number }
  | { type: "pause" }
  | { type: "resume" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "next":
      return { ...state, index: (state.index + 1) % action.total };
    case "prev":
      return { ...state, index: (state.index - 1 + action.total) % action.total };
    case "jump":
      return { ...state, index: action.index };
    case "pause":
      return { ...state, autoPlay: false };
    case "resume":
      return { ...state, autoPlay: true };
    default:
      return state;
  }
}

export function BenefitsCarousel({ images, alt }: BenefitsCarouselProps) {
  const [state, dispatch] = useReducer(reducer, { index: 0, autoPlay: true });
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    dispatch({ type: "pause" });
    resumeTimerRef.current = setTimeout(() => dispatch({ type: "resume" }), RESUME_DELAY);
  }, []);

  const goNext = useCallback(() => {
    dispatch({ type: "next", total: images.length });
  }, [images.length]);

  const goPrev = useCallback(() => {
    dispatch({ type: "prev", total: images.length });
  }, [images.length]);

  const handleManualNav = useCallback(
    (cb: () => void) => {
      cb();
      scheduleResume();
    },
    [scheduleResume]
  );

  // Auto-slide
  useEffect(() => {
    if (prefersReducedMotion || !state.autoPlay || images.length <= 1) return;
    const id = window.setInterval(goNext, AUTO_SLIDE_INTERVAL);
    return () => window.clearInterval(id);
  }, [state.autoPlay, goNext, images.length, prefersReducedMotion]);

  // Keyboard navigation when focus is inside the carousel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onKeyDown(e: KeyboardEvent) {
      if (images.length <= 1) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleManualNav(goPrev);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleManualNav(goNext);
      }
    }

    el.addEventListener("keydown", onKeyDown);
    return () => el.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, handleManualNav, images.length]);

  // Cleanup resume timer on unmount
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const currentImage = images[state.index];

  // No images — show placeholder
  if (images.length === 0) {
    return (
      <PlaceholderAsset
        isHidden={false}
        alt={alt}
        className="mx-auto mt-8 h-72 max-w-5xl rounded-xl border border-[var(--ms-border)]"
        priority
      />
    );
  }

  // Single image — no controls
  if (images.length === 1) {
    return (
      <div className="relative mx-auto mt-8 h-72 max-w-5xl overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)]">
        <img
          src={currentImage!.imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />
      </div>
    );
  }

  // Multiple images — full carousel
  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Why Choose Us images"
      aria-roledescription="carousel"
      className="relative mx-auto mt-8 h-72 max-w-5xl overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] focus-within:outline-none"
      onMouseEnter={() => dispatch({ type: "pause" })}
      onMouseLeave={() => {
        if (resumeTimerRef.current) return; // still in post-manual pause window
        dispatch({ type: "resume" });
      }}
      onFocus={() => dispatch({ type: "pause" })}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          dispatch({ type: "resume" });
        }
      }}
    >
      {/* Slides */}
      {images.map((img, i) => (
        <div
          key={img.storagePath || img.imageUrl || i}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${i + 1} of ${images.length}`}
          aria-hidden={i !== state.index}
          className={`absolute inset-0 transition-opacity ${
            prefersReducedMotion ? "" : "duration-500"
          } ${i === state.index ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <img
            src={i === state.index ? img.imageUrl : img.thumbnailUrl || img.imageUrl}
            alt={i === state.index ? alt : ""}
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/35" />

      {/* Prev button */}
      <button
        type="button"
        onClick={() => handleManualNav(goPrev)}
        className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)]/80 text-[var(--ms-heading)] backdrop-blur-sm transition-all hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-gradient-end)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ms-gradient-end)]"
        aria-label="Previous slide"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Next button */}
      <button
        type="button"
        onClick={() => handleManualNav(goNext)}
        className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)]/80 text-[var(--ms-heading)] backdrop-blur-sm transition-all hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-gradient-end)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ms-gradient-end)]"
        aria-label="Next slide"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div
        className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2"
        role="tablist"
        aria-label="Slide indicators"
      >
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === state.index}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => {
              dispatch({ type: "jump", index: i });
              scheduleResume();
            }}
            className={`h-2 rounded-full transition-all ${
              prefersReducedMotion ? "" : "duration-300"
            } ${
              i === state.index
                ? "w-6 bg-[var(--ms-gradient-end)]"
                : "w-2 bg-[var(--ms-border)] hover:bg-[var(--ms-body)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
