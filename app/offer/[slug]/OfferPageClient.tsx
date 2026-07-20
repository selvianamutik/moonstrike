"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, ShoppingCart } from "lucide-react";
import type { PrivateOfferRow } from "@/lib/admin/private-offers";

export function OfferPageClient({
  offer,
  gameName,
  gameImage,
}: {
  offer: PrivateOfferRow;
  gameName: string;
  gameImage: string;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const finalPrice = offer.price_usd * (1 - offer.discount_percent / 100);

  const categoryLabels: Record<string, string> = {
    boosting: "Boosting",
    coaching: "Coaching",
    playmate: "Playmate",
  };

  const categoryIcons: Record<string, string> = {
    boosting: "⚡",
    coaching: "📚",
    playmate: "🎮",
  };

  async function addToCart() {
    setAdding(true);
    setError("");
    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          privateOffer: true,
          serviceId: `private-${offer.id}`,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Failed to add to cart.");
        return;
      }

      router.push("/cart");
    } catch {
      setError("Network error.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-24">
      <div className="rounded-xl border border-[var(--ms-accent)] bg-[var(--ms-secondary)] p-8 sm:p-12">
        {gameImage && (
          <div className="relative -mx-8 -mt-8 mb-8 overflow-hidden rounded-t-xl sm:-mx-12 sm:-mt-12">
            <Image
              src={gameImage}
              alt={gameName}
              width={896}
              height={300}
              className="h-48 w-full object-cover sm:h-64"
              priority
            />
          </div>
        )}
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--ms-gradient-end)]">
          <span>{gameName}</span>
          <span className="text-[var(--ms-accent)]">/</span>
          <span>{categoryIcons[offer.category]} {categoryLabels[offer.category] ?? offer.category}</span>
        </div>

        <h1 className="font-display mt-4 text-4xl font-black tracking-[-0.04em] text-white">
          {offer.title}
        </h1>

        <div className="mt-8 grid grid-cols-2 gap-6 rounded-lg border border-[var(--ms-accent)] bg-[var(--ms-primary)] p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#64748B]">Platform</p>
            <p className="mt-1 text-lg font-semibold text-white">{offer.platform || "All Platforms"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#64748B]">Quantity</p>
            <p className="mt-1 text-lg font-semibold text-white">{offer.quantity}x</p>
          </div>
        </div>

        {offer.additional_info && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.12em] text-[#64748B] mb-2">Details</p>
            <p className="text-[var(--ms-body)] leading-relaxed whitespace-pre-wrap">{offer.additional_info}</p>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between gap-6 border-t border-[var(--ms-accent)] pt-8">
          <div>
            {offer.discount_percent > 0 ? (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-[#22D3EE]">${finalPrice.toFixed(2)}</span>
                <span className="text-lg text-[#64748B] line-through">${offer.price_usd.toFixed(2)}</span>
                <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-bold text-green-400">-{offer.discount_percent}%</span>
              </div>
            ) : (
              <span className="text-3xl font-black text-[#22D3EE]">${offer.price_usd.toFixed(2)}</span>
            )}
          </div>

          <button
            onClick={addToCart}
            disabled={adding}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--admin-accent)] to-[#6366F1] px-8 py-3 text-sm font-bold text-white transition-all hover:shadow-[0_0_30px_var(--admin-accent-hover)] disabled:opacity-50"
          >
            {adding ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
            {adding ? "Adding..." : "Add to Cart"}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>
        )}
      </div>
    </section>
  );
}
