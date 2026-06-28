"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PlaceholderAsset } from "@/components/asset-image";
import { Badge } from "@/components/ui";
import type { LandingHeroData } from "@/lib/cms/landing";

interface HeroCarouselProps {
  heroes: LandingHeroData[];
}

const AUTO_SLIDE_INTERVAL = 6000;

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

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
    window.setTimeout(() => setIsAutoPlay(true), 10000);
  }, []);

  useEffect(() => {
    if (!isAutoPlay || heroes.length <= 1) return;

    const interval = window.setInterval(goToNext, AUTO_SLIDE_INTERVAL);
    return () => window.clearInterval(interval);
  }, [isAutoPlay, goToNext, heroes.length]);

  if (heroes.length === 0) return null;

  const currentHero = heroes[currentIndex];
  const ctaClassName = "ms-button mt-6 h-11 px-6";
  const cta = isExternalHref(currentHero.ctaHref) ? (
    <a href={currentHero.ctaHref} target="_blank" rel="noopener noreferrer" className={ctaClassName}>
      {currentHero.ctaText}
    </a>
  ) : (
    <Link href={currentHero.ctaHref} className={ctaClassName}>
      {currentHero.ctaText}
    </Link>
  );

  return (
    <div className="relative">
      <div className="relative mt-0">
        <div
          className="grid overflow-hidden rounded-xl border border-[var(--ms-border)] bg-[var(--ms-bg-card)] lg:grid-cols-[1fr_280px]"
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => {
            if (heroes.length > 1) setIsAutoPlay(true);
          }}
        >
        <div className="relative min-h-[450px] overflow-hidden">
          {currentHero.imageUrl ? (
            <Image
              src={currentHero.imageUrl}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover opacity-80 transition-opacity duration-300"
              priority={currentIndex === 0}
            />
          ) : (
            <PlaceholderAsset alt="Hero banner" className="min-h-[450px]" priority imageClassName="p-20" isHidden={true} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />

          <div className="absolute bottom-8 left-8 z-20 max-w-xl pr-16">
            <div className="flex max-w-lg flex-wrap gap-2">
              {currentHero.badges?.length ? (
                currentHero.badges.map((badge) => (
                  <Badge key={badge} variant="featured">
                    {badge}
                  </Badge>
                ))
              ) : (
                <Badge variant={currentHero.badgeVariant} />
              )}
            </div>
            <h1 className="font-display mt-5 text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              {currentHero.headline}
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-8 text-[var(--ms-body)]">{currentHero.subtext}</p>
            {cta}
          </div>

          {heroes.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => handleManualNav(goToPrev)}
                className="absolute left-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)]/90 text-[var(--ms-heading)] backdrop-blur-sm transition-all hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-bg-card)] hover:text-[var(--ms-gradient-end)]"
                aria-label="Previous slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => handleManualNav(goToNext)}
                className="absolute right-4 top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--ms-border)] bg-[var(--ms-bg-card)]/90 text-[var(--ms-heading)] backdrop-blur-sm transition-all hover:border-[var(--ms-gradient-end)] hover:bg-[var(--ms-bg-card)] hover:text-[var(--ms-gradient-end)]"
                aria-label="Next slide"
              >
                <ChevronRight size={20} />
              </button>

              <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
                {heroes.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsAutoPlay(false);
                      window.setTimeout(() => setIsAutoPlay(true), 10000);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex ? "w-8 bg-[var(--ms-gradient-end)]" : "w-2 bg-[var(--ms-border)] hover:bg-[var(--ms-body)]"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <aside className="border-l border-[var(--ms-border)] p-5">
          <p className="mono text-sm uppercase tracking-[0.18em] text-[var(--ms-body)]">Coming Soon</p>
          {["Elite Trials Return", "Mythic+ Cache Update", "Ranked Climb Events"].map((item) => (
            <div key={item} className="mt-5 flex gap-4">
              <PlaceholderAsset alt={`${item} preview`} className="h-12 w-20 rounded" imageClassName="p-3" isHidden={false} />
              <p className="text-sm leading-4">
                <Badge variant="featured" />
                <span className="mt-2 block text-[var(--ms-body)]">{item}</span>
              </p>
            </div>
          ))}
        </aside>
        </div>
      </div>
    </div>
  );
}
