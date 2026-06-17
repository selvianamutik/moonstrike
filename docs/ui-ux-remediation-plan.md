# MoonStrike UI/UX Remediation Plan

**Date:** June 5, 2026  
**Based on:** docs/ui-ux-audit.md  
**Reference:** ui-ux-pro-max skill

---

## Overview

This plan translates the audit findings into actionable, prioritized implementation tasks. Each fix references ui-ux-pro-max guidelines and includes specific implementation patterns.

---

## Phase 1: Critical Fixes (Week 1)

> These must be resolved immediately as they block core user flows.

### 1.1 Cart Page — Quantity Controls & Remove

**File:** pp/cart/page.tsx

**Problem:**
- + and - buttons have no onClick handlers
- Remove button has no click handler

**Implementation Pattern (ui-ux-pro-max):**

`	sx
// Use local state for cart management
function CartItem({ item, onUpdate, onRemove }) {
  const [quantity, setQuantity] = useState(item.quantity);
  
  const handleIncrement = () => {
    const newQty = quantity + 1;
    setQuantity(newQty);
    onUpdate(item.id, newQty);
  };
  
  const handleDecrement = () => {
    if (quantity <= 1) {
      onRemove(item.id);
    } else {
      const newQty = quantity - 1;
      setQuantity(newQty);
      onUpdate(item.id, newQty);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-md border border-[var(--ms-border)]">
      <button
        type="button"
        onClick={handleDecrement}
        aria-label={quantity <= 1 ? "Remove item" : "Decrease quantity"}
        className="h-full px-3 text-[var(--ms-body)] hover:text-[var(--ms-gradient-end)] cursor-pointer transition-colors duration-150"
      >
        {quantity <= 1 ? "×" : "-"}
      </button>
      <span className="border-x border-[var(--ms-border)] px-4 mono" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={handleIncrement}
        aria-label="Increase quantity"
        className="h-full px-3 text-[var(--ms-body)] hover:text-[var(--ms-gradient-end)] cursor-pointer transition-colors duration-150"
      >
        +
      </button>
    </div>
  );
}
`

**Accessibility:**
- Add ria-live="polite" for quantity updates
- Include ria-label for each button
- Screen readers announce quantity changes

---

### 1.2 Checkout Form — Validation & Submission

**File:** pp/checkout/page.tsx

**Problem:**
- No validation on card details
- No submission handler

**Implementation Pattern (ui-ux-pro-max — Form Validation):**

`	sx
'use client';

import { useState } from 'react';

type FormErrors = {
  name?: string;
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
};

function validateCardNumber(value: string): string | undefined {
  const cleaned = value.replace(/\s/g, '');
  if (!/^\d{16}$/.test(cleaned)) {
    return "Card number must be 16 digits";
  }
}

function validateExpiry(value: string): string | undefined {
  if (!/^\d{2}\/\d{2}$/.test(value)) {
    return "Use MM/YY format";
  }
  const [month, year] = value.split('/').map(Number);
  if (month < 1 || month > 12) {
    return "Invalid month";
  }
}

function CheckoutForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedPayment, setSelectedPayment] = useState("credit_card");
  
  const handleBlur = (field: keyof FormErrors, value: string, validator: (v: string) => string | undefined) => {
    const error = validator(value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate all fields
    const newErrors: FormErrors = {};
    // ... validation logic
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Process payment
      await processPayment();
    } catch (error) {
      setErrors({ name: "Payment failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Payment Method Selection */}
      <div className="grid gap-4 md:grid-cols-3" role="radiogroup" aria-label="Payment method">
        {[
          { id: "credit_card", label: "Credit Card" },
          { id: "paypal", label: "PayPal" },
          { id: "crypto", label: "Crypto" },
        ].map((method) => (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={selectedPayment === method.id}
            onClick={() => setSelectedPayment(method.id)}
            className={h-24 rounded-md border mono text-sm uppercase cursor-pointer transition-all duration-150 }
          >
            {method.label}
          </button>
        ))}
      </div>

      {/* Card Details */}
      {selectedPayment === "credit_card" && (
        <fieldset className="ms-card mt-12 rounded-xl p-8">
          <legend className="text-xl font-medium px-2">Card Details</legend>
          
          <div>
            <label htmlFor="card-name" className="mono mt-8 block text-xs uppercase text-[var(--ms-body)]">
              Name on Card
            </label>
            <input
              id="card-name"
              name="cardName"
              type="text"
              autoComplete="cc-name"
              required
              aria-describedby={errors.name ? "card-name-error" : undefined}
              aria-invalid={!!errors.name}
              onBlur={(e) => handleBlur("name", e.target.value, (v) => v.length < 2 ? "Name is required" : undefined)}
              className="mt-2 h-12 w-full rounded-md border bg-[var(--ms-field)] px-4 outline-none transition-colors duration-150 focus:border-[var(--ms-gradient-end)] focus:ring-2 focus:ring-[var(--ms-gradient-end)]/20"
            />
            {errors.name && (
              <p id="card-name-error" role="alert" className="mt-1 text-xs text-[var(--ms-danger)]">
                {errors.name}
              </p>
            )}
          </div>
          
          {/* Submit Button with Loading State */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="ms-button mt-7 flex h-12 w-full items-center justify-center mono text-sm uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              "Complete Purchase"
            )}
          </button>
        </fieldset>
      )}
    </form>
  );
}
`

**Key Patterns (ui-ux-pro-max):**
- onBlur validation for inline feedback
- ria-invalid + ria-describedby for error association
- ole="alert" for error announcements
- Loading state with spinner on submit
- 
oValidate to prevent browser defaults

---

### 1.3 Missing ria-live Regions

**Files:** Multiple (cart, service-detail, profile)

**Pattern:**

`	sx
// Global pattern for dynamic content updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {/* Invisible region that screen readers will announce */}
  {announcementMessage}
</div>

// For cart updates:
const [cartAnnouncement, setCartAnnouncement] = useState("");

function updateQuantity(id: string, newQty: number) {
  // Update state
  setCartAnnouncement(Quantity updated to );
}

// For errors:
<div role="alert" className="rounded-md border border-[var(--ms-danger)]/30 bg-[var(--ms-danger)]/10 px-4 py-3 text-sm text-[var(--ms-danger)]">
  {/* Visible error with role="alert" */}
</div>
`

**Implementation Locations:**
1. Cart item quantity changes
2. Cart total price updates
3. Form validation errors
4. Toast/notification appearances

---

## Phase 2: High Priority (Week 2)

> These improve UX quality and brand consistency.

### 2.1 Admin Design System Migration

**Reference:** ui-ux-pro-max Gaming + Financial Dashboard color palette

**Current Problem:**
- Hardcoded #0F172A, #172554, #8B5CF6 scattered in admin components

**Target Color Mapping:**

| Current Hardcoded | Replace With | Usage |
|-------------------|--------------|-------|
| #0F172A | ar(--ms-bg-card) | Card backgrounds |
| #050816 | ar(--ms-bg-page) | Page background |
| #172554 | ar(--ms-border) | Borders |
| #8B5CF6 | ar(--ms-gradient-start) | Primary accent |
| #22D3EE | ar(--ms-success) | Success/positive |
| #EF4444 | ar(--ms-danger) | Danger/warning |
| #94A3B8 | ar(--ms-body) | Body text |
| #FFFFFF | ar(--ms-heading) | Headings |

**Admin CSS Variables (add to pp/admin/admin-theme.css):**

`css
.admin-theme {
  /* Inherit from main design system */
  --admin-bg: var(--ms-bg-page);
  --admin-card: var(--ms-bg-card);
  --admin-border: var(--ms-border);
  --admin-text: var(--ms-heading);
  --admin-muted: var(--ms-body);
  --admin-accent: var(--ms-gradient-start);
  --admin-success: var(--ms-success);
  --admin-danger: var(--ms-danger);
  --admin-primary: var(--primary);
  
  /* Gaming-specific overrides for admin */
  --admin-bg: #020617;
  --admin-card: #0F172A;
  --admin-border: #172554;
  --admin-surface: #1E293B;
  
  color-scheme: dark;
}
`

**Component Migration Example:**

`	sx
// BEFORE (hardcoded)
<div className="bg-[#0F172A] border border-[#172554] rounded-xl p-5">

// AFTER (CSS variables)
<div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-5">
`

---

### 2.2 Sidebar Width Standardization

**Reference:** ui-ux-pro-max Dashboard Layout patterns

**Current Inconsistency:**

| Page | Current Width | Issue |
|------|--------------|-------|
| Games | 260px | Too narrow |
| Profile | 300px | Baseline |
| Cart Summary | 390px | Different |
| Checkout Summary | 450px | Too wide |

**Standardization:**

`	sx
// Create shared sidebar width token in globals.css
:root {
  --sidebar-width: 320px;
  --sidebar-compact: 260px;
  --sidebar-wide: 380px;
}

// Apply consistently:
<aside className="h-fit rounded-xl p-6 lg:sticky lg:top-32" style={{ width: 'var(--sidebar-width)' }}>
`

**Pages to Update:**
1. pp/games/page.tsx — expand sidebar to 320px
2. pp/cart/page.tsx — OrderSummary already 390px, consider reducing
3. pp/checkout/page.tsx — OrderSummary 450px, reduce to 380px

---

### 2.3 Form Input Height Standardization

**Reference:** ui-ux-pro-max Form Accessibility guidelines

**Current:** h-13 (52px) mixed with h-12 (48px)

**Standardization:**

`	sx
// In globals.css — define standard input sizes
:root {
  --input-height-sm: 40px;  /* h-10 */
  --input-height-md: 44px;  /* h-11 (WCAG minimum) */
  --input-height-lg: 48px;  /* h-12 */
  --input-height-xl: 52px;  /* h-13 (deprecated, use lg) */
}

// Standard input component
function Input({
  label,
  id,
  error,
  ...props
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="mono block text-xs uppercase tracking-[0.16em] text-[var(--ms-body)]">
          {label}
        </label>
      )}
      <input
        id={id}
        aria-describedby={error ? ${id}-error : undefined}
        aria-invalid={!!error}
        className="h-[var(--input-height-lg)] w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4 outline-none transition-colors duration-150 focus:border-[var(--ms-gradient-end)] focus:ring-2 focus:ring-[var(--ms-gradient-end)]/20"
        {...props}
      />
      {error && (
        <p id={${id}-error} role="alert" className="text-xs text-[var(--ms-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
`

**Button Heights (WCAG 44px minimum):**

`css
:root {
  --btn-height-sm: 36px;  /* h-9 */
  --btn-height-md: 44px;  /* h-11 — WCAG minimum */
  --btn-height-lg: 48px;  /* h-12 */
  --btn-height-xl: 52px;  /* h-13 — reserve for hero CTAs */
}
`

---

### 2.4 Placeholder Links Fix

**Files:** Multiple

**Pattern:**

`	sx
// BEFORE
<Link href="#" className="hover:text-[var(--ms-gradient-end)]">
  Privacy Policy
</Link>

// AFTER — either real route or pending
<Link href="/privacy" className="hover:text-[var(--ms-gradient-end)]">
  Privacy Policy
</Link>

// OR pending state
<span className="text-[var(--ms-body)] opacity-50 cursor-not-allowed" title="Coming soon">
  Privacy Policy
</span>
`

**Audit & Fix List:**

| File | Current # Links | Action |
|------|-------------------|--------|
| site-footer.tsx | Privacy Policy, all social links | Add real routes |
| site-header.tsx | Notifications # | Remove or link to /notifications |
| dmin-shell.tsx | Support, Privacy, API Docs | Add real routes |
| efund-policy.tsx | Contact Support button | Link to /support or chat |

---

## Phase 3: Medium Priority (Week 3)

### 3.1 Hover & Focus State Audit

**Reference:** ui-ux-pro-max Dark Mode Card + Interactive patterns

**Standard Hover Pattern:**

`css
/* globals.css */
.ms-card-hover {
  cursor-pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.ms-card-hover:hover {
  border-color: var(--ms-gradient-end);
  box-shadow: 0 18px 60px rgba(34, 211, 238, 0.16);
  transform: translateY(-2px); /* Reduced from -3px */
}

/* Prevent overflow clip on small viewports */
@media (max-height: 600px) {
  .ms-card-hover:hover {
    transform: translateY(1px);
  }
}
`

**Button Focus States:**

`css
.ms-button:focus-visible {
  outline: 2px solid var(--ms-gradient-end);
  outline-offset: 3px;
  box-shadow: 0 0 22px rgba(136, 82, 255, 0.45);
}

.ms-button:active {
  transform: translateY(0);
}
`

---

### 3.2 Genre Animation — prefers-reduced-motion

**File:** components/landing-games-section.tsx

**Current Issue:** Genre tab animations run without respecting user preference

**Fix:**

`	sx
// Add at top of component
const prefersReducedMotion = usePrefersReducedMotion(); // hook

const genreAnimationClass = (() => {
  if (prefersReducedMotion) return "";
  if (phase === "exit") {
    return direction === "next" ? "ms-genre-exit-next" : "ms-genre-exit-previous";
  }
  if (phase === "enter") {
    return direction === "next" ? "ms-genre-enter-next" : "ms-genre-enter-previous";
  }
  return "";
})();

// usePrefersReducedMotion hook
function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
`

**Add to globals.css:**

`css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`

---

### 3.3 Light Mode Border Contrast Fix

**Reference:** ui-ux-pro-max Accessibility contrast guidelines (4.5:1 minimum)

**Current:** gba(14, 45, 74, 0.16) — may be too subtle

**Fix:**

`css
/* globals.css */

html[data-theme="light"] {
  /* Increase border opacity for better visibility */
  --ms-border: rgba(14, 45, 74, 0.24);  /* Was 0.16 */
  --ms-border-soft: rgba(17, 118, 128, 0.20);
  
  /* Increase shadow opacity for cards */
  --ms-card-shadow: 0 4px 24px rgba(14, 45, 74, 0.08);
}

/* Solid border alternative for critical separators */
.border-semi {
  border-color: rgba(14, 45, 74, 0.24);
}
`

---

### 3.4 Icon Library Consolidation

**Reference:** ui-ux-pro-max — "No emoji icons, use SVG (Heroicons/Lucide)"

**Fix List:**

| File | Text Fallback | Replace With |
|------|---------------|--------------|
| global-chat-bubble.tsx | X | <X size={16} /> from Lucide |
| ui.tsx (CategoryTabs) | < > | <ChevronLeft /> <ChevronRight /> |
| dmin/dashboard | Text "Edit", "Delete" | <Pencil /> <Trash2 /> |

**Pattern:**

`	sx
// Import from lucide-react (already in use)
import { X, ChevronLeft, ChevronRight, Pencil, Trash2, Search } from "lucide-react";

// Replace text fallbacks
<button aria-label="Close chat" className="cursor-pointer">
  <X size={16} aria-hidden="true" />
</button>

// For admin tables
<td className="flex gap-2">
  <button aria-label="Edit item" className="cursor-pointer text-[var(--ms-body)] hover:text-[var(--ms-gradient-end)]">
    <Pencil size={16} aria-hidden="true" />
  </button>
  <button aria-label="Delete item" className="cursor-pointer text-[var(--ms-body)] hover:text-[var(--ms-danger)]">
    <Trash2 size={16} aria-hidden="true" />
  </button>
</td>
`

---

### 3.5 Admin Chart Implementation

**Reference:** ui-ux-pro-max Financial Dashboard pattern

**Current:** Empty placeholder grid

**Recommended Libraries (in order):**

1. **Recharts** (React-native, composable, themeable)
2. **Chart.js** with eact-chartjs-2
3. **Nivo** (specifically @nivo/line for time series)

**Implementation Pattern (Recharts):**

`	sx
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from 'next-themes'; // if available

const data = [
  { date: 'Oct 20', traffic: 2400, sales: 1400 },
  { date: 'Oct 21', traffic: 3200, sales: 2100 },
  // ...
];

export function TrafficPerformanceChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--ms-border)" />
        <XAxis dataKey="date" stroke="var(--ms-body)" fontSize={12} />
        <YAxis stroke="var(--ms-body)" fontSize={12} />
        <Tooltip
          contentStyle={{
            background: 'var(--ms-bg-card)',
            border: '1px solid var(--ms-border)',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'var(--ms-heading)' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="traffic"
          stroke="#22D3EE"
          strokeWidth={2}
          dot={false}
          name="Traffic"
        />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={false}
          name="Sales"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
`

**Add to admin dashboard:**

`	sx
import { TrafficPerformanceChart } from "@/components/admin/charts/TrafficPerformanceChart";

// In JSX:
<div className="col-span-2 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl p-6">
  <h2 className="text-lg font-bold text-[var(--admin-text)] mb-4">Traffic vs Performance</h2>
  <TrafficPerformanceChart />
</div>
`

---

## Phase 4: Polish (Week 4)

### 4.1 Design Token Documentation

**File to create:** docs/design-tokens.md

`markdown
# MoonStrike Design Tokens

## Spacing Scale
| Token | Value | Usage |
|-------|-------|-------|
| --space-xs | 4px | Tight gaps |
| --space-sm | 8px | Between related items |
| --space-md | 16px | Default gaps |
| --space-lg | 24px | Section gaps |
| --space-xl | 32px | Major section gaps |

## Typography
- Font Body: Montserrat (--font-body)
- Font Mono: JetBrains Mono (--font-mono)

## Border Radius
- --radius-sm: 4px (buttons, inputs)
- --radius-md: 8px (cards)
- --radius-lg: 12px (modals, panels)
- --radius-full: 9999px (pills, badges)
`

---

### 4.2 Interactive Card Improvements

**Pattern for GameCard/ServiceCard:**

`	sx
function ServiceCard({ service }) {
  return (
    <Link 
      href={href} 
      className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gradient-end)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ms-bg-page)]"
    >
      <article className="ms-card ms-card-hover h-full overflow-hidden rounded-lg">
        {/* Image container prevents layout shift */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={service.image} 
            alt={${service.name} preview}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        
        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-[var(--ms-heading)] group-hover:text-[var(--ms-gradient-end)] transition-colors duration-150">
            {service.name}
          </h3>
          <p className="mt-3 text-sm text-[var(--ms-body)]">
            {service.description}
          </p>
          <div className="mt-6 flex items-center justify-between">
            <span className="mono text-base font-bold text-[var(--ms-price)]">
              
            </span>
            <span className="ms-button h-10 px-5 text-sm">
              Buy Now
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
`

---

### 4.3 GlobalChatBubble Improvements

`	sx
// Fix: Replace X text with icon, add real functionality
import { X, Send, MessageCircle } from "lucide-react";

export function GlobalChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(2); // Replace hardcoded with real state
  
  const handleSend = async () => {
    if (!message.trim()) return;
    // Send to support API
    await sendSupportMessage(message);
    setMessage("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Toggle Button */}
      <button
        aria-label={isOpen ? "Close support chat" : "Open support chat"}
        aria-expanded={isOpen}
        className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border border-[var(--ms-gradient-end)] bg-[var(--ms-bg-card)] shadow-[0_16px_45px_rgba(0,0,0,0.45)] hover:bg-[var(--ms-hover-bg)] transition-all duration-150"
      >
        <MessageCircle size={24} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--ms-danger)] px-1 mono text-[10px] text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="h-[480px] w-[320px] rounded-xl border border-[var(--ms-gradient-end)] bg-[var(--ms-bg-card)] shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--ms-border)] px-4 py-3">
            <h2 className="text-sm font-black">Moon Strike Support</h2>
            <button 
              aria-label="Close chat"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[var(--ms-border)] text-[var(--ms-body)] hover:border-[var(--ms-gradient-end)] hover:text-[var(--ms-heading)]"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* ... messages */}
          </div>
          
          {/* Input */}
          <div className="border-t border-[var(--ms-border)] p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="h-11 min-w-0 flex-1 rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-3 text-sm outline-none focus:border-[var(--ms-gradient-end)]"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim()}
                aria-label="Send message"
                className="ms-button flex h-11 cursor-pointer items-center px-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`

---

## Implementation Checklist

### Pre-Delivery (All Phases)

Based on ui-ux-pro-max pre-delivery checklist:

**Visual Quality:**
- [ ] No emojis used as icons — all SVG from Lucide
- [ ] Brand colors verified (check gradient consistency)
- [ ] Hover states don't cause layout shift
- [ ] Cards have overflow-hidden on images

**Interaction:**
- [ ] All clickable elements have cursor-pointer
- [ ] Hover states provide clear visual feedback
- [ ] Transitions are smooth (150-300ms)
- [ ] Focus states visible for keyboard navigation
- [ ] prefers-reduced-motion respected

**Light/Dark Mode:**
- [ ] Light mode text has sufficient contrast (4.5:1 minimum)
- [ ] Glass/transparent elements visible in light mode
- [ ] Borders visible in both modes
- [ ] Test both modes before delivery

**Layout:**
- [ ] Floating elements have proper spacing from edges
- [ ] No content hidden behind fixed navbars
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

**Accessibility:**
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] ria-live regions for dynamic content
- [ ] Focus trap in modals/dialogs

---

## Sprint Breakdown

### Sprint 1 (Week 1) — Critical
- [ ] Cart quantity controls & remove handlers
- [ ] Checkout form validation
- [ ] ria-live regions in cart & checkout

### Sprint 2 (Week 2) — High Priority
- [ ] Admin CSS variables migration
- [ ] Sidebar width standardization
- [ ] Form input height standardization
- [ ] Placeholder links fix

### Sprint 3 (Week 3) — Medium Priority
- [ ] Hover/focus state audit
- [ ] prefers-reduced-motion support
- [ ] Light mode border contrast fix
- [ ] Icon library consolidation
- [ ] Admin chart implementation

### Sprint 4 (Week 4) — Polish
- [ ] Design token documentation
- [ ] Interactive card improvements
- [ ] GlobalChatBubble real functionality
- [ ] Full accessibility audit pass

---

## Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| pp/cart/page.tsx | 1 | Add cart state management |
| pp/checkout/page.tsx | 1 | Add validation, payment handling |
| components/global-chat-bubble.tsx | 1, 4 | Fix icons, real functionality |
| pp/admin/admin-theme.css | 2 | Add admin CSS variables |
| components/admin/*.tsx | 2 | Replace hardcoded colors |
| pp/globals.css | 2, 3 | Add design tokens, fix light mode |
| pp/games/page.tsx | 2 | Sidebar width |
| pp/cart/page.tsx | 2 | Sidebar width |
| pp/checkout/page.tsx | 2 | Sidebar width, form validation |
| components/landing-games-section.tsx | 3 | prefers-reduced-motion |
| components/ui.tsx | 3 | Replace text icons |
| components/admin/charts/TrafficPerformanceChart.tsx | 3 | New chart component |
| pp/admin/dashboard/page.tsx | 3 | Use chart component |
| docs/design-tokens.md | 4 | New documentation |

---

*Plan generated using ui-ux-pro-max skill guidelines.*
*Reference: docs/ui-ux-audit.md*
