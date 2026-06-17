"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PlaceholderAsset } from "@/components/asset-image";
import { Badge } from "@/components/ui";
import type { LandingHeroData } from "@/lib/cms/landing";

interface HeroCarouselProps {
  heroes: LandingHeroData[];
}

const AUTO_SLIDE_INTERVAL = 6000;

export function HeroCarousel({ heroes }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroes.length);
  }, [heroes.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + heroes.length) % heroes.length);
  }, [heroes.length]);

  const handleManualNav = useCallback((callback: () => void) => {
    callback();
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  }, []);

  useEffect(() => {
    if (!isAutoPlay || heroes.length <= 1) return;

    const interval = setInterval(goToNext, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [isAutoPlay, goToNext, heroes.length]);

  const currentHero = heroes[currentIndex];

  return (
    <div className="relative">
      <div className="grid overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] lg:grid-cols-[1fr_280px]">
        <PlaceholderAsset
          alt={"Hero banner"}
          className="min-h-[450px]"
          priority
          imageClassName="p-20"
          isHidden={true}
        >
          {currentHero.imageUrl && (
            <img
              src={currentHero.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
          )}
          <div className="absolute bottom-8 left-8 max-w-xl">
            <Badge variant={currentHero.badgeVariant} />
            <h1 className="font-display mt-5 text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              {currentHero.headline}
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-8 text-[var(--ms-body)]">
              {currentHero.subtext}
            </p>
            <Link href={currentHero.ctaHref} className="ms-button mt-6 h-11 px-6">
              {currentHero.ctaText}
            </Link>
          </div>

          {heroes.length > 0 && (
            <div className="relative h-full w-full border border-black z-10">
              <button
                type="button"
                onClick={() => handleManualNav(goToPrev)}
                className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)]/90 text-xl text-[var(--ms-heading)] backdrop-blur-sm transition-all hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-bg-card)] hover:text-[var(--ms-gradient-end)]"
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => handleManualNav(goToNext)}
                className="absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)]/90 text-xl text-[var(--ms-heading)] backdrop-blur-sm transition-all hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-bg-card)] hover:text-[var(--ms-gradient-end)] lg:right-[296px]"
                aria-label="Next slide"
              >
                ›
              </button>

              <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 lg:left-1/4">
                {heroes.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsAutoPlay(false);
                      setTimeout(() => setIsAutoPlay(true), 10000);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "w-8 bg-[var(--ms-gradient-end)]"
                        : "w-2 bg-[var(--ms-border)] hover:bg-[var(--ms-body)]"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </PlaceholderAsset>

        <aside className="border-l border-[var(--ms-border)] p-5">
          <p className="mono text-sm uppercase tracking-[0.18em] text-[var(--ms-body)]">Coming Soon</p>
          {["Elite Trials Return", "Mythic+ Cache Update", "Ranked Climb Events"].map((item) => (
            <div key={item} className="mt-5 flex gap-4">
              <PlaceholderAsset
                alt={`${item} preview`}
                className="h-12 w-20 rounded"
                imageClassName="p-3"
                isHidden={false}
              />
              <p className="text-sm leading-4">
                <Badge variant="featured" />
                <span className="mt-2 block text-[var(--ms-body)]">{item}</span>
              </p>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
