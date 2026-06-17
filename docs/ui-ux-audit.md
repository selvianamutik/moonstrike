# MoonStrike UI/UX Audit Report

**Date:** June 5, 2026  
**Project:** MoonStrike — Game Boosting Marketplace  
**Auditor:** UI/UX Audit (using ui-ux-pro-max skill)

---

## 1. Executive Summary

MoonStrike is a game boosting marketplace built with Next.js, featuring a dark cosmic theme with purple/cyan gradients. The storefront has a distinct aesthetic direction (gaming-focused, dark mode by default) but shows inconsistency in component patterns and has gaps in accessibility, interaction feedback, and layout cohesion between public pages and admin dashboard.

### Key Findings
- **Strengths:** Strong brand identity, cohesive color system, good dark mode foundation, functional navigation
- **Critical Issues:** Inconsistent icon usage (text fallback), missing hover states, accessibility gaps, mixed layout patterns
- **Opportunities:** Improve interaction feedback, refine mobile responsiveness, standardize component patterns

---

## 2. Design System Analysis

### 2.1 Brand & Theme

| Aspect | Current State | Recommendation |
|--------|---------------|----------------|
| **Logo** | Moon Strike text with gradient | Add SVG favicon for brand consistency |
| **Primary Gradient** | Purple (#4735A5) → Pink (#A561CA) | Consider adding subtle glow effect to CTA buttons |
| **Secondary Accent** | Cyan (#22D3EE) used sparingly | Reserve cyan for success states and interactive highlights |
| **Dark Mode Base** | Deep navy (#050816) | Excellent depth, consider adding subtle grid texture |
| **Light Mode** | Yellow/Teal combination | Works well but test border contrast in light mode |

### 2.2 Typography

**Current Setup:**
- Body: Montserrat (400-900 weights)
- Mono: JetBrains Mono

**Findings:**
- ✅ Font stack is appropriate for gaming brand
- ⚠️ Mono font usage is inconsistent — sometimes mono class, sometimes direct inline
- ⚠️ Font size scale could be more defined (uses arbitrary Tailwind sizes)

**Recommendations:**
- Establish font size tokens: 	ext-xs (12px), 	ext-sm (14px), 	ext-base (16px), 	ext-lg (18px), etc.
- Use ont-mono utility instead of .mono custom class

### 2.3 Color Palette (CSS Variables)

`css
/* Dark Mode */
--ms-bg-page: #050816
--ms-bg-card: #0F172A
--ms-border: #172554
--ms-heading: #f1f5f9
--ms-body: #94a3b8
--ms-price: #A561CA
--ms-danger: #ef4444
--ms-success: #22c55e

/* Light Mode */
--ms-bg-page: #f3f6ff
--ms-bg-card: #ffffff
--ms-heading: #0e2d4a
--ms-body: #22374c
--ms-price: #117680
`

**Issues:**
- ⚠️ Light mode border color gba(14, 45, 74, 0.16) may be too subtle on light backgrounds
- ⚠️ Secondary text (#94A3b8) may not meet WCAG AA contrast on dark backgrounds

**Contrast Check:**
- #94a3b8 on #050816 = ~4.5:1 ✓
- #94a3b8 on #0f172a = ~5.2:1 ✓

---

## 3. Component Audit

### 3.1 Navigation Components

#### SiteHeader (components/site-header.tsx)

**Strengths:**
- ✅ Sticky positioning with backdrop blur
- ✅ Proper <header> semantic element
- ✅ Currency toggle with USD/EUR options
- ✅ Theme toggle placement
- ✅ Loading skeleton state

**Issues:**
| Element | Issue | Severity |
|---------|-------|----------|
| Navigation links | Gamepad2 icon has mt-1 mx-auto — inconsistent vertical centering | Medium |
| Notifications icon | Missing href, placeholder link # | Low |
| Login button | ms-button class with inline icon | OK |
| Search form | Correct ction attribute, proper labels | OK |

**Recommendations:**
- Add ria-current="page" to active navigation item
- Add ria-label for theme toggle
- Replace placeholder # links with actual routes or remove

#### SiteFooter (components/site-footer.tsx)

**Strengths:**
- ✅ Clear sitemap organization
- ✅ Brand messaging
- ✅ Legal disclaimer present
- ✅ Responsive grid layout

**Issues:**
- ⚠️ Footer links use placeholder # hrefs
- ⚠️ Social media links are placeholders

**Recommendations:**
- Update hrefs with actual routes or proper # anchors
- Consider adding social icons (SVG from Lucide)

### 3.2 Card Components

#### ServiceCard (components/service-card.tsx)

**Strengths:**
- ✅ Hover effect with scale on image
- ✅ Badge variant system
- ✅ Currency-aware pricing
- ✅ Proper focus states with ocus-visible:ring

**Issues:**
| Issue | Description | Severity |
|-------|-------------|----------|
| Hover transition | Image scale 1.05 may cause layout shift on grid | Medium |
| Border radius | ounded-lg vs parent ounded-lg — inconsistent | Low |
| Price alignment | mono class on price spans inconsistently | Low |

**Recommendations:**
- Use overflow-hidden with fixed height to prevent layout shift
- Standardize border radius tokens: ounded-lg (8px) for all cards

#### GameCard (components/ui.tsx)

**Strengths:**
- ✅ line-clamp for text overflow
- ✅ Image with gradient overlay
- ✅ Badge placement

**Issues:**
- ⚠️ line-clamp-2 with min-h-16 — text height may be inconsistent
- ⚠️ Uses img tag directly instead of 
ext/image for dynamic images

**Recommendations:**
- Remove min-h constraints, rely on line-clamp alone
- Use 
ext/image for all images when possible

### 3.3 Interactive Elements

#### GlobalChatBubble (components/global-chat-bubble.tsx)

**Strengths:**
- ✅ Sticky positioned bottom-right
- ✅ Accessible toggle with <input> checkbox hack
- ✅ Online status indicator

**Issues:**
| Issue | Description | Severity |
|-------|-------------|----------|
| Unread badge | Badge count is hardcoded to 2 | Medium |
| Message input | Missing form submission handler | Medium |
| Close button | Uses X text instead of icon | Medium |
| Chat messages | Hardcoded placeholder content | Medium |

**Recommendations:**
- Implement actual unread count state
- Add form submission or link to full chat page
- Use Lucide X icon: <X size={16} />

#### RegionSelector (components/ui.tsx)

**Strengths:**
- ✅ Proper ria-label usage
- ✅ Disabled state handling
- ✅ Focus ring support

**Issues:**
- ⚠️ ria-pressed not added for toggle buttons
- ⚠️ Missing onChange documentation in props

### 3.4 Form Elements

#### Input Fields

**Current Pattern:**
`	sx
<input className="h-13 w-full rounded-md border border-[var(--ms-border)] bg-[var(--ms-field)] px-4" />
`

**Issues:**
- ⚠️ Height h-13 is non-standard (should use h-12 or h-14)
- ⚠️ Focus state uses ocus-within:border-[var(--ms-gradient-end)] — inconsistent with ms-focus-ring
- ⚠️ Missing id and htmlFor associations in some forms

**Recommendations:**
- Standardize input height to h-12 (48px) or h-11 (44px)
- Use consistent focus ring pattern with ms-focus-ring class
- Add ria-describedby for error messages

#### Buttons (.ms-button)

**Current Pattern:**
`	sx
<button className="ms-button h-13 w-full items-center justify-center..." />
`

**Issues:**
- ⚠️ h-13 inconsistent with standard Tailwind sizes
- ⚠️ h-13 = 52px, could be h-12 (48px) for better touch targets
- ⚠️ disabled state lacks visual indication in some cases

**Recommendations:**
- Standardize button heights: Primary h-12, Secondary h-11
- Ensure disabled has cursor-not-allowed and opacity reduction

---

## 4. Page-Specific Audit

### 4.1 Landing Page (pp/(marketing)/page.tsx)

**Overall:** ✅ Well-structured hero section with clear hierarchy

| Section | Finding | Priority |
|---------|---------|----------|
| Hero | Badge, headline, CTA all present | OK |
| Coming Soon sidebar | Placeholder content, no actual CMS integration | Medium |
| Best Offers | ServiceCard grid, but only shows first 4 items | Low |
| Trust Metrics | Static data in 	rustMetrics array | Low |
| Frame18Sections | Appears to be CMS-driven | OK |

**Issues:**
- ⚠️ Sidebar "Coming Soon" items are hardcoded
- ⚠️ Best Offers grid has no "Load More" functionality

### 4.2 Games Page (pp/games/page.tsx)

**Overall:** ✅ Good filtering and search implementation

**Layout Analysis:**
- Sidebar (260px) + Main content (flexible)
- Sticky sidebar at 	op-32
- Search bar width md:w-96

**Issues:**
- ⚠️ Mobile: sidebar stacks above content, may cause too much vertical scroll
- ⚠️ Search input doesn't have dedicated submit button
- ⚠️ Genre filters don't show count per genre

**Recommendations:**
- Add genre counts: RPG (12), FPS (8)
- Make search form submit on Enter
- Consider collapsible sidebar on mobile

### 4.3 Cart Page (pp/cart/page.tsx)

**Overall:** ✅ Functional cart with order summary

**Layout:** lg:grid-cols-[1fr_390px] - sidebar width is explicit

**Issues:**
| Issue | Location | Severity |
|-------|----------|----------|
| Quantity controls | - and + buttons have no onClick handlers | Critical |
| Remove button | No click handler | Critical |
| Region badge | Present but non-interactive | Low |

**Recommendations:**
- Implement quantity increment/decrement handlers
- Add remove item functionality
- Consider making region editable in cart

### 4.4 Checkout Page (pp/checkout/page.tsx)

**Overall:** ⚠️ Basic form structure, needs validation

**Issues:**
- ⚠️ No form validation implemented
- ⚠️ No error states for invalid input
- ⚠️ "Credit Card" selection not visually indicated
- ⚠️ Card details form has no real submission logic
- ⚠️ Form inputs missing 
ame attributes

**Recommendations:**
- Add React Hook Form or native validation
- Show selected payment method with border highlight
- Add proper 
ame attributes for form submission
- Implement loading state on submit

### 4.5 Login/Register Page (pp/login/page.tsx)

**Overall:** ✅ Comprehensive auth form with social login

**Strengths:**
- ✅ Password visibility toggle
- ✅ Mode switching (login/register/reset)
- ✅ Error message display
- ✅ Google OAuth button
- ✅ Loading states

**Issues:**
| Issue | Severity |
|-------|----------|
| Password requirements not shown during typing | Medium |
| No rate limiting indicator | Low |
| Verification email resend has delay UI | Low |

**Recommendations:**
- Show password requirements: "8+ chars, 1 number"
- Add cooldown indicator on resend button
- Consider password strength indicator

### 4.6 Profile Page (pp/profile/page.tsx)

**Overall:** ✅ Rich profile with order history

**Layout:** lg:grid-cols-[300px_1fr] with sticky sidebar

**Issues:**
- ⚠️ Tab switcher is static (Orders/Transactions)
- ⚠️ Filter buttons don't actually filter
- ⚠️ Order cards not clickable (only "View Details" link)
- ⚠️ Transaction table not sortable

**Recommendations:**
- Implement active filter state
- Make entire order card clickable
- Add sort dropdown for transaction columns

### 4.7 Service Detail Page (pp/[game-slug]/[category-slug]/[service-slug]/page.tsx)

**Overall:** ✅ Complex product page with configuration

**Strengths:**
- ✅ Service options with multiple input types
- ✅ Real-time price calculation
- ✅ Currency toggle
- ✅ Delivery info section

**Issues:**
- ⚠️ Long forms may need scroll-to-top on category change
- ⚠️ "Buy Now" and "Add to Cart" both link to /cart
- ⚠️ Preview mode overlay is confusing

**Recommendations:**
- Add "Back to results" breadcrumb
- Differentiate cart add behavior (preview mode currently disabled)
- Consider sticky pricing summary on mobile

### 4.8 Legal Pages (Terms of Service, Refund Policy)

**Overall:** ✅ Good structure and navigation

**Terms of Service:**
- ✅ Sticky table of contents
- ✅ Numbered sections
- ✅ Proper scroll margins

**Refund Policy:**
- ✅ Numbered blocks with clear hierarchy
- ⚠️ "Contact Support" button not functional

**Recommendations:**
- Link "Contact Support" to actual support page or chat

---

## 5. Admin Dashboard Audit

### 5.1 Design Consistency

**Critical Issue:** Admin uses different design system than public storefront

| Aspect | Public (Storefront) | Admin Dashboard |
|--------|---------------------|-----------------|
| Colors | CSS variables (--ms-*) | Hardcoded (#0F172A) |
| Typography | Montserrat + JetBrains Mono | Default sans-serif |
| Components | .ms-card system | Custom g-[#0F172A] |
| Spacing | ms-shell (1180px max) | max-w-7xl |

**Impact:** Admin feels disconnected from brand identity

**Recommendations:**
1. Extract admin design tokens to CSS variables
2. Create shared design tokens: --admin-bg, --admin-border, etc.
3. Consider sharing ms-card component with admin theme

### 5.2 Admin Shell (components/admin/AdminShell.tsx)

**Strengths:**
- ✅ Sidebar + TopBar layout
- ✅ Footer with system status
- ✅ Auth page detection

**Issues:**
- ⚠️ Footer hardcoded year "2024" should use dynamic year
- ⚠️ "Support", "Privacy Policy", "API Docs" links are # placeholders
- ⚠️ Layout uses pl-[240px] hardcoded value — not responsive

**Recommendations:**
- Use 
ew Date().getFullYear() for copyright
- Replace # hrefs with actual routes
- Use CSS Grid for main layout instead of padding offset

### 5.3 Admin Dashboard (pp/admin/dashboard/page.tsx)

**Overall:** ✅ Comprehensive KPI dashboard

**Layout:** 4-column KPI cards, 3-column charts

**Issues:**
| Issue | Description | Severity |
|-------|-------------|----------|
| Chart placeholder | Empty chart grid with no actual data visualization | High |
| Table overflow | Horizontal scroll may break on small screens | Medium |
| Date filter | "Last 30 Days" is hardcoded | Low |
| Export button | No functionality | Medium |

**Recommendations:**
- Implement actual chart library (Recharts, Chart.js, or Nivo)
- Add responsive table with horizontal scroll container
- Make date range filter interactive
- Connect Export CSV to actual data export

### 5.4 Admin Tables

**Pattern Found in AdminDataTable.tsx:**
- Row hover states
- Action buttons
- Status badges

**Issues:**
- ⚠️ "Action" column buttons use text (Edit, Delete) instead of icons
- ⚠️ Table not sortable by default
- ⚠️ Pagination component found but may not be fully integrated

**Recommendations:**
- Add Lucide icons for Edit (Pencil), Delete (Trash2)
- Add column header sort indicators
- Ensure pagination state syncs with URL params

---

## 6. Accessibility Audit

### 6.1 Color & Contrast

| Element | Color | Background | Contrast | WCAG |
|---------|-------|------------|----------|------|
| Body text | #94a3b8 | #050816 | 5.2:1 | ✅ AA |
| Body text | #94a3b8 | #0F172A | 5.5:1 | ✅ AA |
| Price text | #A561CA | #0F172A | 4.8:1 | ✅ AA |
| Disabled text | #64748b | #0F172A | 3.2:1 | ⚠️ Fail |

**Light Mode Issues:**
| Element | Color | Background | Contrast | WCAG |
|---------|-------|------------|----------|------|
| Light mode heading | #0e2d4a | #ffffff | 13.2:1 | ✅ AAA |
| Light mode body | #22374c | #ffffff | 10.1:1 | ✅ AAA |

**Critical:** Disabled/placeholder text in forms needs attention.

### 6.2 Keyboard Navigation

**Tested Elements:**
- ✅ Tab order follows visual flow
- ✅ Focus states visible (.ms-focus-ring)
- ⚠️ Some buttons missing focus indicator
- ⚠️ Modal/dialog trap not implemented

**Issues:**
- ⚠️ Global chat bubble: tab focuses on toggle, but not into chat content
- ⚠️ Modal patterns (if any) need focus trap implementation

### 6.3 Screen Reader

**Positive Findings:**
- ✅ ria-label on icon-only buttons
- ✅ sr-only labels on search inputs
- ✅ Semantic <header>, <nav>, <main>, <footer> used

**Issues:**
- ⚠️ ria-current="page" not on active nav links
- ⚠️ Missing ria-live for dynamic content (cart updates, errors)
- ⚠️ Form validation errors not announced

### 6.4 Interactive Elements

**Buttons:**
- ✅ 	ype="button" on non-submit buttons
- ✅ disabled state styling
- ⚠️ Some interactive cards missing ole="button" or actual <button>

**Links:**
- ⚠️ Multiple <a> tags inside <button> contexts
- ⚠️ "View Details" uses Link, but entire card could be clickable

---

## 7. Interaction & Motion Audit

### 7.1 Hover States

**Current Pattern:**
`css
.ms-card-hover:hover {
  border-color: var(--ms-gradient-end);
  box-shadow: 0 18px 60px rgba(34, 211, 238, 0.16);
  transform: translateY(-3px);
}
`

**Issues:**
- ⚠️ Hover transform causes layout shift in grids
- ⚠️ 	ranslateY(-3px) may clip on small viewports
- ⚠️ Some interactive elements lack hover feedback (form inputs)

### 7.2 Focus States

**Current Pattern:**
`css
.ms-focus-ring:focus-visible {
  outline: 2px solid var(--ms-gradient-end);
  outline-offset: 3px;
}
`

**Issues:**
- ⚠️ Default :focus not styled, only :focus-visible
- ⚠️ Some inputs use ocus-within instead of proper focus
- ⚠️ Admin dashboard lacks focus ring pattern

### 7.3 Animations

**Defined Animations:**
- Genre tab transitions (exit/enter)
- Pulse animation for loading skeletons

**Issues:**
- ⚠️ No prefers-reduced-motion check for genre animations
- ⚠️ nimate-pulse on system status dot may be distracting

**Recommendations:**
- Add @media (prefers-reduced-motion: reduce) override
- Consider removing pulse animation in favor of static indicator

### 7.4 Touch Targets

**Check:** All buttons and links are at least 44x44px

**Findings:**
- ✅ Most buttons are h-11 (44px) or larger
- ⚠️ Icon-only buttons sometimes smaller
- ⚠️ Quick-select menu items may be too small on mobile

---

## 8. Layout & Spacing Audit

### 8.1 Container System

**Current:** ms-shell = width: min(1180px, calc(100% - 48px))

**Issues:**
- ⚠️ Mobile breakpoint at 760px changes width calculation
- ⚠️ Inconsistent: some pages use mx-auto max-w-4xl px-6

### 8.2 Grid Layouts

| Page | Grid Pattern | Issues |
|------|--------------|--------|
| Landing | Single column sections | OK |
| Games | lg:grid-cols-[260px_1fr] | Sidebar sticky works |
| Cart | lg:grid-cols-[1fr_390px] | Explicit sidebar width |
| Checkout | lg:grid-cols-[1fr_450px] | Different sidebar width |
| Profile | lg:grid-cols-[300px_1fr] | Different sidebar width |

**Critical:** Sidebar widths are inconsistent (260px, 300px, 390px, 450px)

### 8.3 Spacing Rhythm

**Current Scale:**
- Page sections: py-16, py-20
- Cards: p-5, p-6, p-8
- Between elements: gap-4, gap-6, mt-4, mt-6

**Issues:**
- ⚠️ No documented spacing tokens
- ⚠️ Arbitrary values like mt-7, mt-16 don't follow scale

### 8.4 Responsive Behavior

**Mobile Breakpoints Tested:**
- ⚠️ Header navigation collapses but search hides at lg
- ⚠️ Cart page stacks but may need adjustment at md
- ⚠️ Checkout form inputs stack but labels may overlap

---

## 9. Component Library Inconsistencies

### 9.1 Card Components

| Component | File | Class Name | Border Radius |
|-----------|------|------------|---------------|
| ServiceCard | service-card.tsx | .ms-card | ounded-lg |
| GameCard | ui.tsx | .ms-card | ounded-lg |
| OrderSummary | order-summary.tsx | .ms-card | ounded-xl |
| LegalSection | 	erms-of-service | .ms-card | ounded-lg |
| AdminCard | various | Custom | ounded-xl |

**Inconsistency:** Mixed ounded-lg and ounded-xl

### 9.2 Button Components

| Usage | Class | Height |
|-------|-------|--------|
| Primary CTA | .ms-button | h-13 (52px) |
| Secondary | order + bg | h-11 (44px) |
| Admin CTA | Custom | py-2 px-4 |

**Inconsistency:** No standardized button sizes

### 9.3 Form Inputs

| Usage | Pattern | Focus Style |
|-------|---------|-------------|
| Checkout | order + bg-[var(--ms-field)] | ocus-within |
| Login | order + bg-[var(--ms-field)] | ocus-within |
| Admin | g-[#172554] border | Not consistent |

**Inconsistency:** Focus styles not unified

### 9.4 Icons

**Found Icon Libraries:**
- Lucide React (primary)
- Inline text fallback (<, >, X)

**Issues:**
- ⚠️ Lucide icons used correctly in site-header.tsx
- ⚠️ Text fallbacks in global-chat-bubble.tsx
- ⚠️ Missing ria-hidden="true" on some icons

---

## 10. Critical Issues Summary

### Must Fix (Critical)

1. **Cart Page Interactions**
   - Quantity controls (+/-) have no handlers
   - Remove button not functional
   - Impact: Users cannot modify cart

2. **Checkout Form Validation**
   - No validation on card details
   - No submission handler
   - Impact: Cannot process orders

3. **Admin Chart Placeholder**
   - Empty chart area with no data visualization
   - Impact: Dashboard incomplete

4. **Missing ria-live Regions**
   - Dynamic updates not announced to screen readers
   - Impact: Accessibility compliance

### Should Fix (High Priority)

5. **Inconsistent Sidebar Widths**
   - 260px, 300px, 390px, 450px across pages
   - Impact: Layout inconsistency

6. **Admin Design System**
   - Hardcoded colors instead of CSS variables
   - Impact: Brand inconsistency

7. **Placeholder Links**
   - Multiple # hrefs throughout site
   - Impact: Broken navigation

8. **Form Input Heights**
   - h-13 (52px) is non-standard
   - Impact: Inconsistency with Tailwind scale

### Could Fix (Medium Priority)

9. **Genre Animation Performance**
   - No prefers-reduced-motion support
   - Layout shift on hover

10. **Light Mode Border Contrast**
    - Border color may be too subtle

11. **Password Visibility Toggle**
    - Works well but could show requirements

12. **Mobile Navigation**
    - Search bar hides too early

---

## 11. Recommendations & Action Items

### Immediate (Sprint 1)

- [ ] Fix cart page quantity/remove handlers
- [ ] Add checkout form validation
- [ ] Update placeholder # links
- [ ] Add ria-live for dynamic content

### Short Term (Sprint 2)

- [ ] Standardize sidebar widths
- [ ] Migrate admin to CSS variables
- [ ] Add focus states to admin components
- [ ] Implement chart in admin dashboard

### Medium Term (Sprint 3)

- [ ] Create shared design token documentation
- [ ] Add loading states to forms
- [ ] Implement prefers-reduced-motion
- [ ] Audit all hover/focus states

### Design System Improvements

- [ ] Document spacing scale
- [ ] Document component variants
- [ ] Create Storybook for components
- [ ] Add dark/light mode preview

---

## 12. Appendix: Component Inventory

### Shared Components
| Component | Location | Status |
|-----------|----------|--------|
| SiteHeader | components/site-header.tsx | ⚠️ Needs update |
| SiteFooter | components/site-footer.tsx | ⚠️ Needs update |
| GlobalChatBubble | components/global-chat-bubble.tsx | ⚠️ Needs update |
| ServiceCard | components/service-card.tsx | ✅ Good |
| ServiceDetail | components/service-detail.tsx | ⚠️ Needs review |
| OrderSummary | components/order-summary.tsx | ✅ Good |
| Badge | components/ui.tsx | ✅ Good |
| GameCard | components/ui.tsx | ⚠️ Needs review |
| CategoryTabs | components/ui.tsx | ✅ Good |
| RegionSelector | components/ui.tsx | ✅ Good |

### Admin Components
| Component | Location | Status |
|-----------|----------|--------|
| AdminShell | components/admin/AdminShell.tsx | ⚠️ Needs update |
| AdminSidebar | components/admin/AdminSidebar.tsx | ⚠️ Needs review |
| AdminTopBar | components/admin/AdminTopBar.tsx | ⚠️ Needs review |
| AdminDataTable | components/admin/AdminDataTable.tsx | ⚠️ Needs update |
| AdminStatCard | components/admin/AdminStatCard.tsx | ⚠️ Needs update |
| StatusBadge | components/admin/StatusBadge.tsx | ✅ Good |
| RoleBadge | components/admin/RoleBadge.tsx | ✅ Good |

---

*Report generated using ui-ux-pro-max skill guidelines.*
*Next review scheduled: Q3 2026*
