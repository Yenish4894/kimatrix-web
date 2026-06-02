# sena-temp (KIMates) — Complete UI/UX Design Specification

> Comprehensive design system and page-by-page UI/UX spec for building the KIMates frontend.
> Every color, font, spacing value, component, and layout decision is defined here.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout System](#4-spacing--layout-system)
5. [Responsive Breakpoints](#5-responsive-breakpoints)
6. [Iconography & Imagery](#6-iconography--imagery)
7. [Component Design Language](#7-component-design-language)
8. [Page-by-Page UI/UX Specs](#8-page-by-page-uiux-specs)
9. [Animation & Transitions](#9-animation--transitions)
10. [Accessibility](#10-accessibility)
11. [Performance & Low-Bandwidth Considerations](#11-performance--low-bandwidth-considerations)
12. [Bilingual (i18n) UI Patterns](#12-bilingual-i18n-ui-patterns)

---

## 1. Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Mobile-First** | Customer QR form is designed for phones first. All layouts start from 320px and scale up. |
| **Clarity Over Decoration** | Strong contrast, clear fonts, large touch targets. No decorative clutter — every element earns its place. |
| **Trust & Professionalism** | Clean, modern SaaS aesthetic that signals reliability. Businesses are paying for this — it must look worth it. |
| **Low-Bandwidth Friendly** | Minimal images, SVG icons, compressed assets. Works well on 3G connections and budget Android devices. |
| **Culturally Resonant** | Warm, energetic color palette that connects to West African visual preferences — bold, confident, grounded. |
| **Bilingual Native** | UI accommodates English and French text lengths from day 1. No truncation, no overflow. |

### Design Personality

- **Professional** but not cold — warm tones prevent the sterile "enterprise software" feel
- **Simple** but not basic — thoughtful spacing and hierarchy create polish
- **Bold** but not loud — confident color choices without visual noise
- **Modern** but not trendy — timeless patterns that won't feel dated in 2 years

---

## 2. Color System

### Why Warm Brown + Copper?

- **Warm Brown** is derived directly from the KiMaterix logo — conveys heritage, trust, solidity, and earthiness
- **Copper/Sienna** accent pulled from the leaf gradient in the logo — warmth, growth, energy
- **Cream background** mirrors the logo's warm off-white — cohesive brand experience, culturally resonant in West Africa
- **High contrast** in bright sunlight — dark brown on cream reads well outdoors (fuel station QR scanning)

### Brand Colors

#### Primary — Warm Brown (Trust, Heritage, Solidity)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | `#FDF6EF` | Subtle backgrounds, hover states on light surfaces |
| `primary-100` | `#F9E8D4` | Selected/active row highlights, light badges |
| `primary-200` | `#F2CCAC` | Progress bars, light borders |
| `primary-300` | `#E4A87A` | Decorative accents, chart elements |
| `primary-400` | `#D07848` | Secondary buttons hover, links hover |
| `primary-500` | `#B85A28` | Links, secondary actions, icons |
| `primary-600` | `#8B3A10` | **Main brand color** — primary buttons, nav active states, key UI elements |
| `primary-700` | `#6B2800` | Primary button hover, dark accents |
| `primary-800` | `#4E1E00` | Sidebar background, dark surfaces |
| `primary-900` | `#361400` | Darkest brand usage, footer |
| `primary-950` | `#1E0900` | Near-black brand tint |

#### Accent — Copper/Sienna (Warmth, Growth, Action)

| Token | Hex | Usage |
|-------|-----|-------|
| `accent-50` | `#FDF3EB` | Accent background tint |
| `accent-100` | `#FAE3CC` | Light accent badges, notifications background |
| `accent-200` | `#F4C49A` | Accent borders |
| `accent-300` | `#EAA06B` | Chart accents, secondary highlights |
| `accent-400` | `#DC7E42` | Hover for accent buttons |
| `accent-500` | `#C4713A` | **Main accent** — CTAs, important highlights, badges, counters |
| `accent-600` | `#A85A28` | Accent button hover, emphasis |
| `accent-700` | `#8A4418` | Dark accent usage |

#### Neutrals — Warm Cream (Text, Backgrounds, Borders)

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | `#F5EDE0` | Page background (warm cream) |
| `neutral-100` | `#F9E8D4` | Card backgrounds, secondary surfaces |
| `neutral-200` | `#EDD8C0` | Borders, dividers, input borders |
| `neutral-300` | `#D9B898` | Disabled states, placeholder text |
| `neutral-400` | `#B88A68` | Helper text, icons (inactive) |
| `neutral-500` | `#8B6248` | Secondary text, labels |
| `neutral-600` | `#6B3A20` | Body text |
| `neutral-700` | `#4E2800` | Headings, strong text |
| `neutral-800` | `#3D1A00` | Sidebar text, primary dark surfaces |
| `neutral-900` | `#2A1000` | Highest contrast text |
| `neutral-950` | `#150800` | Near black |

### Semantic Colors

| Purpose | Color | Hex | Tailwind | Usage |
|---------|-------|-----|----------|-------|
| **Success** | Emerald | `#10B981` | `emerald-500` | Success toasts, confirmed states, active plans |
| **Success Light** | Emerald | `#D1FAE5` | `emerald-100` | Success badge backgrounds |
| **Warning** | Amber | `#F59E0B` | `amber-500` | Expiring plans, pending states |
| **Warning Light** | Amber | `#FEF3C7` | `amber-100` | Warning badge backgrounds |
| **Error** | Rose | `#F43F5E` | `rose-500` | Validation errors, destructive actions |
| **Error Light** | Rose | `#FFE4E6` | `rose-100` | Error badge backgrounds |
| **Info** | Sky | `#0EA5E9` | `sky-500` | Informational tooltips, help text |
| **Info Light** | Sky | `#E0F2FE` | `sky-100` | Info badge backgrounds |

### Surface Colors

| Surface | Color | Usage |
|---------|-------|-------|
| **Page Background** | `#F5EDE0` (warm cream) | Main page background |
| **Card Background** | `#FFFFFF` (white) | Cards, modals, dropdowns |
| **Sidebar Background** | `#4E1E00` (primary-800) | Main sidebar |
| **Sidebar Text** | `#F9E8D4` (primary-100) | Sidebar labels and icons |
| **Sidebar Active** | `#8B3A10` (primary-600) | Active nav item background |
| **Header Background** | `#FFFFFF` (white) | Top header bar |
| **Header Border** | `#EDD8C0` (neutral-200) | Header bottom border |

### Color Usage Rules

1. **Never use raw hex values in components** — always use Tailwind classes or CSS variables
2. **Primary-600 is the hero color** — use it for primary buttons, active nav, key UI elements
3. **Accent-500 is for attention** — CTAs on landing page, notification badges, important counters
4. **Keep semantic colors pure** — don't use `emerald` for decoration, only for success/positive states
5. **Text on primary-600+** must be white for WCAG AA contrast
6. **Text on accent-500** must be white for WCAG AA contrast
7. **Minimum 4.5:1 contrast ratio** for all body text against backgrounds

---

## 3. Typography

### Font Family

| Role | Font | Weight Range | Why |
|------|------|-------------|-----|
| **Headings** | **Plus Jakarta Sans** | 600–700 | Modern geometric sans-serif with personality. Warm and professional. Full French diacritical support. |
| **Body & UI** | **Inter** | 400–600 | Designed for screens. Excellent readability at all sizes. Industry standard for SaaS. Perfect French accent rendering. |
| **Monospace** | **JetBrains Mono** | 400 | Invoice numbers, vehicle registration numbers, data fields where alignment matters. |

### Font Loading Strategy

```css
/* Load from Google Fonts with display=swap for fast rendering */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700&family=JetBrains+Mono:wght@400&display=swap');
```

### Type Scale

Based on a **1.25 ratio** (Major Third) — balanced for both mobile and desktop readability.

| Token | Size | Line Height | Weight | Font | Usage |
|-------|------|-------------|--------|------|-------|
| `text-display` | 36px / 2.25rem | 1.2 | 700 | Plus Jakarta Sans | Hero headings (homepage only) |
| `text-h1` | 30px / 1.875rem | 1.25 | 700 | Plus Jakarta Sans | Page titles |
| `text-h2` | 24px / 1.5rem | 1.3 | 600 | Plus Jakarta Sans | Section headings |
| `text-h3` | 20px / 1.25rem | 1.35 | 600 | Plus Jakarta Sans | Card headings, sub-sections |
| `text-h4` | 18px / 1.125rem | 1.4 | 600 | Plus Jakarta Sans | Small headings, form group titles |
| `text-body-lg` | 18px / 1.125rem | 1.6 | 400 | Inter | Lead paragraphs, important descriptions |
| `text-body` | 16px / 1rem | 1.6 | 400 | Inter | Default body text |
| `text-body-sm` | 14px / 0.875rem | 1.5 | 400 | Inter | Secondary text, table cells, helper text |
| `text-caption` | 12px / 0.75rem | 1.4 | 500 | Inter | Labels, badges, timestamps, metadata |
| `text-overline` | 11px / 0.6875rem | 1.4 | 600 | Inter | Overline labels, uppercase category tags |
| `text-mono` | 14px / 0.875rem | 1.5 | 400 | JetBrains Mono | Invoice numbers, registration numbers |

### Mobile Type Adjustments

| Token | Desktop | Mobile (< 640px) |
|-------|---------|-------------------|
| `text-display` | 36px | 28px |
| `text-h1` | 30px | 24px |
| `text-h2` | 24px | 20px |
| `text-h3` | 20px | 18px |

### Typography Rules

1. **Never go below 14px** for any readable text (12px only for captions/metadata)
2. **Body text color:** `slate-600` (#475569) on light backgrounds
3. **Heading text color:** `slate-800` (#1E293B) on light backgrounds
4. **Muted/helper text:** `slate-400` (#94A3B8)
5. **Link color:** `teal-600` (#0D9488), underline on hover
6. **Max line length:** 65–75 characters for optimal readability
7. **French text** often runs 15–20% longer than English — always test with FR strings

---

## 4. Spacing & Layout System

### Spacing Scale (4px base)

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | Reset |
| `space-0.5` | 2px | Micro spacing (icon padding) |
| `space-1` | 4px | Tight spacing within elements |
| `space-2` | 8px | Inner padding small, gaps between inline elements |
| `space-3` | 12px | Default inner padding, form field gaps |
| `space-4` | 16px | Standard component padding, card padding mobile |
| `space-5` | 20px | Medium padding |
| `space-6` | 24px | Card padding desktop, section gaps |
| `space-8` | 32px | Large section spacing |
| `space-10` | 40px | Between page sections |
| `space-12` | 48px | Major layout gaps |
| `space-16` | 64px | Hero section padding |
| `space-20` | 80px | Page-level vertical spacing |

### Layout Grid

| Context | Max Width | Columns | Gutter |
|---------|-----------|---------|--------|
| **Homepage** | 1280px | 12 | 24px |
| **Dashboard** | Full width (sidebar + content) | — | — |
| **Content area** | 1024px (within dashboard) | 12 | 16px |
| **Forms** | 480px (single column) | 1 | — |
| **QR Form (mobile)** | 100% viewport | 1 | 16px |

### Sidebar Layout

| Element | Value |
|---------|-------|
| Sidebar width (expanded) | 260px |
| Sidebar width (collapsed) | 72px |
| Header height | 64px |
| Content padding | 24px |
| Content min-height | calc(100vh - 64px) |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Small badges, tags |
| `rounded-md` | 6px | Buttons, inputs, dropdowns |
| `rounded-lg` | 8px | Cards, modals |
| `rounded-xl` | 12px | Large cards, hero elements |
| `rounded-2xl` | 16px | QR code container, featured cards |
| `rounded-full` | 9999px | Avatars, status dots, pills |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift — inputs, small cards |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modals, popovers |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Large modals, floating panels |

---

## 5. Responsive Breakpoints

| Name | Value | Target |
|------|-------|--------|
| `xs` | 0–639px | Small phones (QR form primary target) |
| `sm` | 640px+ | Large phones, small tablets |
| `md` | 768px+ | Tablets |
| `lg` | 1024px+ | Small desktops, laptops |
| `xl` | 1280px+ | Standard desktops |
| `2xl` | 1536px+ | Large monitors |

### Breakpoint Behavior

| Component | xs–sm | md | lg+ |
|-----------|-------|-----|------|
| **Homepage nav** | Hamburger menu | Hamburger menu | Full horizontal nav |
| **Sidebar** | Hidden (overlay) | Collapsed (icons only) | Expanded (icons + labels) |
| **Dashboard cards** | 1 column, stacked | 2 columns | 3–4 columns |
| **Data tables** | Card view (stacked) | Horizontal scroll | Full table |
| **QR Form** | Full width, vertical | Centered 480px max | Centered 480px max |
| **Auth forms** | Full width | Split screen (image + form) | Split screen |

---

## 6. Iconography & Imagery

### Icon System

| Property | Value |
|----------|-------|
| **Library** | Lucide React (consistent, MIT licensed, tree-shakeable) |
| **Default size** | 20px (body context), 24px (nav/header), 16px (inline/tables) |
| **Stroke width** | 1.75px (slightly bolder for readability on low-res screens) |
| **Color** | Inherits text color via `currentColor` |

### Icon Usage

| Context | Size | Color |
|---------|------|-------|
| Sidebar navigation | 24px | `teal-100` (inactive), `white` (active) |
| Header actions | 20px | `slate-500` |
| Form field icons | 20px | `slate-400` |
| Button icons | 18px | Inherits button text color |
| Status indicators | 16px | Semantic color (success/warning/error) |
| Empty state illustrations | 120px | `slate-300` |

### Imagery Guidelines

1. **Minimize raster images** — use SVG illustrations where possible
2. **Homepage only:** 1–2 hero images, WebP format, lazy loaded, max 200KB each
3. **No stock photos** — use simple geometric illustrations or abstract patterns
4. **QR code display:** Render as SVG, not PNG. Downloadable as PDF.
5. **Company avatars:** Generated initials (colored circle + white text) — no upload needed for MVP
6. **Empty states:** Simple line illustrations (Lucide icons at large size + descriptive text)

---

## 7. Component Design Language

### 7.1 Buttons

#### Variants

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| **Primary** | `teal-600` | `white` | none | Main actions: Save, Submit, Register |
| **Primary Hover** | `teal-700` | `white` | none | — |
| **Secondary** | `white` | `teal-600` | `teal-600` 1px | Secondary actions: Cancel, Back |
| **Secondary Hover** | `teal-50` | `teal-700` | `teal-700` 1px | — |
| **Accent** | `orange-500` | `white` | none | High-priority CTAs: "Get Started", "Subscribe Now" |
| **Accent Hover** | `orange-600` | `white` | none | — |
| **Ghost** | `transparent` | `slate-600` | none | Tertiary actions, icon buttons |
| **Ghost Hover** | `slate-100` | `slate-700` | none | — |
| **Danger** | `rose-500` | `white` | none | Destructive actions: Delete, Deactivate |
| **Danger Hover** | `rose-600` | `white` | none | — |

#### Sizes

| Size | Height | Padding (x) | Font Size | Border Radius | Min Touch Target |
|------|--------|-------------|-----------|---------------|-----------------|
| `sm` | 32px | 12px | 13px | 6px | 44px (mobile padding) |
| `md` | 40px | 16px | 14px | 6px | 44px |
| `lg` | 48px | 24px | 16px | 6px | 48px |

#### Button Rules

1. **Always 44px minimum touch target on mobile** (even if visual height is 32px, add padding)
2. **Loading state:** Replace text with spinner, maintain button width to prevent layout shift
3. **Disabled state:** 50% opacity, `cursor-not-allowed`, no hover effect
4. **Icon + Text:** Icon left of text, 8px gap, icon 18px
5. **Full width on mobile** for primary actions in forms

### 7.2 Inputs

#### Text Input

| State | Border | Background | Label Color | Shadow |
|-------|--------|-----------|-------------|--------|
| **Default** | `slate-200` 1px | `white` | `slate-600` | none |
| **Hover** | `slate-300` 1px | `white` | `slate-600` | none |
| **Focus** | `teal-500` 2px | `white` | `teal-600` | `0 0 0 3px rgba(20,184,166,0.15)` |
| **Error** | `rose-500` 2px | `white` | `rose-500` | `0 0 0 3px rgba(244,63,94,0.15)` |
| **Disabled** | `slate-200` 1px | `slate-50` | `slate-400` | none |

#### Input Specs

| Property | Value |
|----------|-------|
| Height | 44px (mobile-friendly touch target) |
| Padding | 12px horizontal |
| Font size | 16px (prevents iOS zoom on focus) |
| Border radius | 6px |
| Label position | Above input, 4px margin-bottom |
| Label font | Inter 14px, 500 weight |
| Error message | Below input, 4px margin-top, `rose-500`, 13px |
| Helper text | Below input, `slate-400`, 13px |
| Placeholder | `slate-300`, normal weight |

#### Select / Dropdown

- Same dimensions as text input (44px height, 6px radius)
- Chevron icon right-aligned, `slate-400`
- Dropdown panel: white background, `shadow-lg`, 8px border-radius, max-height 240px with scroll
- Options: 40px height, `slate-600` text, `teal-50` hover background, `teal-600` selected text with checkmark

### 7.3 Cards

#### Standard Card

| Property | Value |
|----------|-------|
| Background | `white` |
| Border | `slate-200` 1px |
| Border radius | 8px |
| Padding | 24px (desktop), 16px (mobile) |
| Shadow | `shadow-sm` (default), `shadow-md` (hover if clickable) |

#### Stat Card (Dashboard)

```
┌─────────────────────────────┐
│  [Icon]                      │
│                              │
│  Total Customers             │  ← caption, slate-500, 12px
│  1,247                       │  ← h2, slate-800, 24px, bold
│  ↑ 12% from last month      │  ← caption, emerald-500, 12px
└─────────────────────────────┘
```

| Property | Value |
|----------|-------|
| Icon container | 40px circle, `teal-100` bg, `teal-600` icon |
| Stat number | Plus Jakarta Sans, 24px, 700 weight |
| Trend indicator | Arrow icon + percentage, semantic color |
| Min width | 200px |

### 7.4 Tables

#### Desktop Table

| Property | Value |
|----------|-------|
| Header bg | `slate-50` |
| Header text | `slate-500`, 12px, 600 weight, uppercase |
| Row height | 52px |
| Row border | `slate-100` 1px bottom |
| Row hover | `slate-50` background |
| Cell text | `slate-600`, 14px |
| Cell padding | 12px horizontal |
| Rounded corners | 8px on outer table container |

#### Mobile Table (Card View)

On `xs` breakpoints, tables transform into stacked cards:

```
┌──────────────────────────────┐
│  John Doe                     │  ← Primary identifier, bold
│  ──────────────────────────── │
│  Vehicle:  AB-123-CD          │  ← label: value pairs
│  Invoice:  INV-00234          │
│  Amount:   ₣25,000            │
│  Date:     12 Apr 2026        │
└──────────────────────────────┘
```

### 7.5 Badges / Tags

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| **Active / Success** | `emerald-100` | `emerald-700` | none |
| **Pending / Warning** | `amber-100` | `amber-700` | none |
| **Expired / Error** | `rose-100` | `rose-700` | none |
| **Info** | `sky-100` | `sky-700` | none |
| **Neutral** | `slate-100` | `slate-600` | none |
| **Brand** | `teal-100` | `teal-700` | none |

Specs: height 24px, padding 8px horizontal, 12px font, 500 weight, 9999px radius (pill shape).

### 7.6 Modal / Dialog

| Property | Value |
|----------|-------|
| Overlay | `rgba(15, 23, 42, 0.5)` — `slate-900` at 50% opacity |
| Container bg | `white` |
| Border radius | 12px |
| Max width | 480px (small), 640px (medium), 800px (large) |
| Padding | 24px |
| Shadow | `shadow-xl` |
| Close button | Top-right, ghost button with X icon |
| Header | `text-h3`, bottom border `slate-200` |
| Footer | Top border `slate-200`, right-aligned buttons, 16px gap |
| Entrance | Fade in overlay (150ms) + scale up content from 95% (200ms) |
| Mobile | Full-screen slide-up from bottom on `xs` breakpoint |

### 7.7 Toast Notifications

| Variant | Left Border | Icon | Background |
|---------|-------------|------|-----------|
| **Success** | 4px `emerald-500` | CheckCircle | `white` |
| **Error** | 4px `rose-500` | XCircle | `white` |
| **Warning** | 4px `amber-500` | AlertTriangle | `white` |
| **Info** | 4px `sky-500` | Info | `white` |

Position: **top-right** on desktop, **top-center** on mobile.
Auto-dismiss: 5 seconds. Shadow: `shadow-lg`. Border radius: 8px.

### 7.8 Navigation (Sidebar)

```
┌─────────────────────────────────────────────┐
│                                             │
│  ┌──────────────┐                           │
│  │   KIMates     │  ← Logo, white text      │
│  │   ☰ Toggle    │                          │
│  └──────────────┘                           │
│                                             │
│  ── MAIN ──────── ← section label, teal-300 │
│                                             │
│  [■] Dashboard    ← active: teal-600 bg,    │
│                      white text, rounded-md │
│  [ ] Customers    ← inactive: transparent,  │
│                      teal-100 text          │
│  [ ] QR Code      ← hover: teal-700 bg     │
│  [ ] Reports                                │
│                                             │
│  ── ACCOUNT ─────                           │
│                                             │
│  [ ] Settings                               │
│  [ ] Logout                                 │
│                                             │
│  ┌──────────────┐                           │
│  │ Plan: Active  │  ← Plan status badge,    │
│  │ 12 days left  │     bottom of sidebar    │
│  └──────────────┘                           │
│                                             │
└─────────────────────────────────────────────┘

Background: teal-800 (#115E59)
Width: 260px expanded / 72px collapsed
```

| Element | Spec |
|---------|------|
| Logo text | Plus Jakarta Sans, 20px, 700 weight, white |
| Section labels | Inter, 11px, 600 weight, uppercase, `teal-300` |
| Nav items | Inter, 14px, 500 weight, 44px height, 12px padding-x |
| Active item | `teal-600` bg, white text, `rounded-md` |
| Inactive item | Transparent bg, `teal-100` text |
| Hover item | `teal-700` bg |
| Icon size | 20px, 12px gap to label |
| Collapsed | Icons only, centered, tooltip on hover |

### 7.9 Header Bar

```
┌──────────────────────────────────────────────────────────────┐
│  [☰ Menu]    Page Title              [🔔] [EN/FR] [Avatar ▾] │
└──────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Height | 64px |
| Background | White |
| Border bottom | 1px `slate-200` |
| Page title | `text-h3`, `slate-800` |
| Actions | 40px icon buttons, `slate-500` icons, `slate-100` hover bg |
| Avatar | 36px circle, company initials, `teal-600` bg, white text |
| Language toggle | Pill switch: EN | FR, `teal-600` active, `slate-200` inactive |
| Mobile menu button | 44px touch target, hamburger icon, visible on < `lg` |

---

## 8. Page-by-Page UI/UX Specs

### 8.1 Public Homepage

#### Layout Structure (Desktop)

```
┌──────────────────────────────────────────────────────────┐
│  HEADER NAV                                               │
│  [KIMates Logo]           [How it Works] [Pricing] [Login]│
│                                              [Register ▶] │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  HERO SECTION (teal-800 background, white text)           │
│                                                           │
│  Track Every Customer Purchase                            │
│  with a Single QR Code                                    │
│                                                           │
│  Simple, powerful purchase tracking for fuel stations      │
│  and shops in Niger. Subscribe, get your QR code,         │
│  and start collecting customer data instantly.             │
│                                                           │
│  [Get Started →]  [See How It Works]                      │
│           ▲ accent          ▲ secondary (white outline)   │
│                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │
│  │  500+   │  │  2,000+ │  │  99.9%  │  ← stats strip   │
│  │Companies│  │Customers│  │ Uptime  │                    │
│  └─────────┘  └─────────┘  └─────────┘                   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  HOW IT WORKS (3-step process, white background)          │
│                                                           │
│  ①                    ②                    ③              │
│  Register &           Share Your           Track &        │
│  Subscribe            QR Code              Report         │
│                                                           │
│  Sign up, choose      Print or display     View customer  │
│  your plan, and       your unique QR       data, stats,   │
│  get started in       code at your         and download   │
│  minutes.             business.            PDF reports.   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  PRICING SECTION (slate-50 background)                    │
│                                                           │
│  Simple, Transparent Pricing                              │
│                                                           │
│  ┌──────────────┐      ┌──────────────────┐              │
│  │  15-Day Plan  │      │  30-Day Plan     │              │
│  │               │      │  ★ POPULAR       │  ← accent   │
│  │  $XX          │      │                  │    badge     │
│  │  per period   │      │  $XX             │              │
│  │               │      │  per period      │              │
│  │  ✓ QR Code    │      │                  │              │
│  │  ✓ Dashboard  │      │  ✓ Everything    │              │
│  │  ✓ Reports    │      │  ✓ in 15-day     │              │
│  │               │      │  ✓ + Extended    │              │
│  │  [Choose Plan]│      │                  │              │
│  │   secondary   │      │  [Choose Plan]   │              │
│  └──────────────┘      │   primary        │              │
│                         └──────────────────┘              │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  BUSINESS TYPES (white background)                        │
│                                                           │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  ⛽ Fuel      │      │  🏪 Shop      │                  │
│  │  Station      │      │               │                  │
│  │               │      │  Track all    │                  │
│  │  Track fuel   │      │  customer     │                  │
│  │  purchases    │      │  invoices     │                  │
│  │  with vehicle │      │  with name    │                  │
│  │  registration │      │  and totals   │                  │
│  └──────────────┘      └──────────────┘                   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  CTA BANNER (teal-600 background, white text)             │
│                                                           │
│  Ready to grow your business?                             │
│  [Register Now →]  accent button                          │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  FOOTER (teal-900 background, teal-100 text)              │
│                                                           │
│  KIMates          Quick Links       Contact               │
│  © 2026           Home              support@kimates.com   │
│                   Pricing           +227 XXXX             │
│                   Login                                   │
│                   Register          Niamey, Niger         │
│                                                           │
│  [EN | FR]        Privacy | Terms                         │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

#### Mobile Homepage

- **Nav:** Logo left + hamburger right. Dropdown menu on toggle.
- **Hero:** Stacked vertically, smaller text, full-width CTA buttons.
- **Steps:** Vertical stack (1 per row) instead of 3-column.
- **Pricing:** Stacked cards, full width, popular card on top.
- **Footer:** Single column, stacked sections.

### 8.2 Auth Pages (Login & Register)

#### Layout — Split Screen (Desktop)

```
┌────────────────────────────┬────────────────────────────┐
│                            │                            │
│  LEFT PANEL (teal-800 bg)  │  RIGHT PANEL (white bg)    │
│                            │                            │
│  KIMates                   │  Welcome Back              │
│                            │                            │
│  "Track every customer     │  Login to your account     │
│   purchase with a          │                            │
│   single QR code"          │  ┌──────────────────────┐  │
│                            │  │ Username             │  │
│  ┌────────────────────┐    │  └──────────────────────┘  │
│  │                    │    │  ┌──────────────────────┐  │
│  │  Simple SVG        │    │  │ Password         [👁] │  │
│  │  illustration of   │    │  └──────────────────────┘  │
│  │  QR code scanning  │    │                            │
│  │                    │    │  [Forgot password?]        │
│  └────────────────────┘    │                            │
│                            │  [Login →]  primary, full  │
│  ✓ 500+ businesses trust   │                            │
│    KIMates                 │  ─── OR ───                │
│  ✓ Setup in under 5 min    │                            │
│  ✓ No tech skills needed   │  Don't have an account?   │
│                            │  [Register →]              │
│                            │                            │
└────────────────────────────┴────────────────────────────┘
```

#### Mobile Auth

- Left panel hidden entirely
- Full-screen white form
- Logo at top center
- Form centered vertically with padding

#### Login Form Fields

| Field | Type | Validation |
|-------|------|-----------|
| Username | Text input | Required |
| Password | Password input with show/hide toggle | Required, min 8 chars |

#### Registration Form Fields

| Field | Type | Validation |
|-------|------|-----------|
| Company Name | Text | Required |
| Physical Address | Text | Required |
| Registration Number | Text | Required |
| Email | Email | Required, valid email |
| Contact Number | Tel | Required, valid phone |
| WhatsApp Number | Tel | Optional |
| Username | Text | Required, unique (async check) |
| Password | Password | Required, min 8, 1 upper, 1 number |
| Confirm Password | Password | Required, must match |
| Plan Duration | Dropdown (15 days / 30 days) | Required |
| Business Type | Dropdown (Fuel Station / Shop) | Required |
| Promotional Emails | Checkbox | Optional, default unchecked |
| Terms & Privacy | Checkbox | Required to submit |

#### Registration Form Layout

Multi-section form (not multi-step) with clear section dividers:

```
Section 1: Business Information
  ├── Company Name (full width)
  ├── Physical Address (full width)
  ├── Registration Number (full width)
  ├── Business Type [dropdown] (half width)
  └── Plan Duration [dropdown] (half width)

Section 2: Contact Information
  ├── Email (full width)
  ├── Contact Number (half width)
  └── WhatsApp Number (half width)

Section 3: Account Setup
  ├── Username (full width)
  ├── Password (half width)
  └── Confirm Password (half width)

Section 4: Agreements
  ├── [✓] I agree to receive promotional emails
  └── [✓] I agree to the Terms of Service and Privacy Policy *

[Register →] primary, full width on mobile, right-aligned on desktop
```

### 8.3 Company Dashboard

#### Dashboard Layout

```
┌──────┬───────────────────────────────────────────────────┐
│      │  HEADER: Company Dashboard     [🔔] [EN|FR] [AV] │
│      ├───────────────────────────────────────────────────┤
│  S   │                                                   │
│  I   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│  D   │  │ Total    │ │ Total    │ │ Top      │ │ Plan ││
│  E   │  │Customers │ │ Spend    │ │ Spender  │ │Status││
│  B   │  │ 247      │ │ ₣2.4M   │ │ Ali M.   │ │Active││
│  A   │  │ ↑12%     │ │ ↑8%     │ │ ₣180K   │ │23 dys││
│  R   │  └──────────┘ └──────────┘ └──────────┘ └──────┘│
│      │                                                   │
│      │  ┌────────────────────────┐ ┌────────────────────┐│
│      │  │                        │ │                    ││
│      │  │  YOUR QR CODE          │ │ RECENT CUSTOMERS   ││
│      │  │                        │ │                    ││
│      │  │  ┌──────────────┐      │ │ Name    Amount Date││
│      │  │  │              │      │ │ ───────────────────││
│      │  │  │   [QR CODE]  │      │ │ Ali M.  ₣25K  Today│
│      │  │  │   (SVG)      │      │ │ Fatima  ₣12K  Today│
│      │  │  │              │      │ │ Omar H. ₣8K   Yest.│
│      │  │  └──────────────┘      │ │ Amina   ₣45K  Yest.│
│      │  │                        │ │ Moussa  ₣15K  2d   ││
│      │  │  [Download PDF]        │ │                    ││
│      │  │  [Print QR Code]       │ │ [View All →]       ││
│      │  │                        │ │                    ││
│      │  └────────────────────────┘ └────────────────────┘│
│      │                                                   │
└──────┴───────────────────────────────────────────────────┘
```

#### Sidebar Navigation Items (Company)

| Icon | Label | Route |
|------|-------|-------|
| LayoutDashboard | Dashboard | `/company/dashboard` |
| Users | Customers | `/company/customers` |
| QrCode | QR Code | `/company/qr-code` |
| FileText | Reports | `/company/reports` |
| Settings | Settings | `/company/settings` |
| LogOut | Logout | — |

#### Dashboard Stat Cards

| Card | Icon | Primary Value | Trend |
|------|------|--------------|-------|
| Total Customers | Users | Count | % change |
| Total Spend | DollarSign | Currency formatted | % change |
| Top Spender | Trophy | Customer name + amount | — |
| Plan Status | Shield | Active/Expired badge | Days remaining |

#### QR Code Section

- Large QR code rendered as SVG, centered in a `rounded-2xl` card with light `teal-50` background
- Company name displayed below QR code
- Two action buttons: **Download PDF** (primary), **Print** (secondary)
- QR code encodes URL: `https://kimates.com/purchase/{company-unique-id}`

#### Customer Data Table

| Column | Type | Sortable |
|--------|------|---------|
| Full Name | Text | Yes |
| Vehicle Reg (Fuel Station only) | Mono text | Yes |
| Invoice Number | Mono text | Yes |
| Invoice Amount | Currency | Yes |
| Date | Date | Yes (default: newest first) |
| Total Accumulated | Currency | Yes |

- Search bar above table (search by name, invoice number)
- Pagination: 20 rows per page, numbered pages
- Export button: Download as PDF

#### Reports Page

| Report | Description | Action |
|--------|-------------|--------|
| All Customers Report | Full customer data export | Download PDF |
| Top 10 Report | Top 10 by accumulated spend | Download PDF |

### 8.4 Customer QR Form (Mobile-First)

This is the most critical mobile experience. Customers scan a QR code at a fuel station or shop and fill in their purchase details. No login, no friction.

#### Mobile Layout (Primary)

```
┌──────────────────────────────┐
│                              │
│  ┌──────────────────────┐    │
│  │    KIMates Logo      │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │  ⛽ TOTAL Fuel Station │   │  ← Company name + type
│  └──────────────────────┘    │     badge, teal-600 bg card
│                              │
│  Record Your Purchase        │  ← h2, centered
│  ─────────────────────────   │
│                              │
│  ┌──────────────────────┐    │
│  │ Full Name *           │    │
│  │ [                   ] │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │  ← Only for Fuel Station
│  │ Vehicle Reg. Number * │    │
│  │ [         ] (no spaces│    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │ Invoice Number *      │    │
│  │ [                   ] │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │ Invoice Amount *      │    │
│  │ [₣                  ] │    │  ← Currency prefix
│  └──────────────────────┘    │
│                              │
│  [Submit Purchase →]         │  ← primary, full width,
│                              │     48px height
│                              │
│  ─── TOP 10 CUSTOMERS ───    │
│                              │
│  ┌──────────────────────┐    │
│  │ 🥇 Ali Mohamed  ₣180K │    │  ← Gold bg tint
│  │ 🥈 Fatima Abdu  ₣145K │    │  ← Silver bg tint
│  │ 🥉 Omar Hassan  ₣120K │    │  ← Bronze bg tint
│  │  4. Amina Sow    ₣98K │    │
│  │  5. Moussa Idi   ₣87K │    │
│  │  ...                   │    │
│  └──────────────────────┘    │
│                              │
│  Powered by KIMates          │  ← footer, small text
│                              │
└──────────────────────────────┘
```

#### QR Form Specs

| Property | Value |
|----------|-------|
| Max width | 480px (centered on larger screens) |
| Background | White, minimal — fast loading |
| Top section | Company name + business type badge |
| Form inputs | 44px height, 16px font (prevents iOS zoom) |
| Submit button | 48px height, full width, `teal-600`, bold text |
| Top 10 section | Visible below form, always shown |

#### Form Fields by Business Type

**Fuel Station:**
| Field | Type | Validation | Keyboard |
|-------|------|-----------|----------|
| Full Name | Text | Required, min 2 chars | text |
| Vehicle Registration | Text | Required, no spaces allowed | text (uppercase) |
| Invoice Number | Text | Required | text |
| Invoice Amount | Number | Required, positive number | numeric |

**Shop:**
| Field | Type | Validation | Keyboard |
|-------|------|-----------|----------|
| Full Name | Text | Required, min 2 chars | text |
| Invoice Number | Text | Required | text |
| Invoice Amount | Number | Required, positive number | numeric |

#### Success State (After Submission)

```
┌──────────────────────────────┐
│                              │
│        ✓ (large green        │
│          checkmark,          │
│          animated)           │
│                              │
│  Purchase Recorded!          │
│                              │
│  Thank you, Ali Mohamed.     │
│  Your purchase of ₣25,000   │
│  has been recorded.          │
│                              │
│  Your Total: ₣180,000       │  ← accumulated total
│  Your Rank: #1 of 247       │  ← ranking
│                              │
│  [Submit Another Purchase]   │  ← secondary button
│                              │
└──────────────────────────────┘
```

#### Top 10 Ranking Display

| Rank | Style |
|------|-------|
| #1 | Gold gradient left border, `amber-50` bg, trophy icon |
| #2 | Silver left border, `slate-50` bg |
| #3 | Bronze (orange-200) left border, `orange-50` bg |
| #4–10 | Standard card rows, `white` bg |

Each row: Rank number, Full Name, Accumulated Total (right-aligned, bold).

### 8.5 Super Admin Panel

#### Admin Sidebar Navigation

| Icon | Label | Route |
|------|-------|-------|
| LayoutDashboard | Dashboard | `/admin/dashboard` |
| Building2 | Companies | `/admin/companies` |
| Eye | Visitor Stats | `/admin/visitors` |
| Mail | Bulk Email | `/admin/email` |
| Settings | Settings | `/admin/settings` |
| LogOut | Logout | — |

#### Admin Dashboard

```
┌──────┬───────────────────────────────────────────────────┐
│      │  HEADER: Admin Dashboard          [🔔] [EN|FR] [A]│
│      ├───────────────────────────────────────────────────┤
│  S   │                                                   │
│  I   │  ┌───────────┐ ┌───────────┐ ┌───────────┐      │
│  D   │  │ Total     │ │ Active    │ │ Website   │      │
│  E   │  │ Companies │ │ Plans     │ │ Visitors  │      │
│  B   │  │ 142       │ │ 98        │ │ 3,451     │      │
│  A   │  └───────────┘ └───────────┘ └───────────┘      │
│  R   │                                                   │
│      │  COMPANIES TABLE                                  │
│      │  ┌─────────────────────────────────────────────┐  │
│      │  │ [Search...] [Type ▾] [Status ▾] [Plan ▾]   │  │
│      │  ├─────────────────────────────────────────────┤  │
│      │  │ Company    Type    Plan    Status   Actions │  │
│      │  │ ─────────────────────────────────────────── │  │
│      │  │ TOTAL Fuel  Fuel   30-day  ●Active  [⋮]    │  │
│      │  │ Sahel Shop  Shop   15-day  ●Active  [⋮]    │  │
│      │  │ Niger Gas   Fuel   30-day  ●Expired [⋮]    │  │
│      │  │ Zinder..    Shop   15-day  ●Inactive[⋮]    │  │
│      │  ├─────────────────────────────────────────────┤  │
│      │  │ ← 1 2 3 ... 8 →                            │  │
│      │  └─────────────────────────────────────────────┘  │
│      │                                                   │
└──────┴───────────────────────────────────────────────────┘
```

#### Company Actions (Admin)

The `[⋮]` menu dropdown provides:
- **View Details** → Expands company info
- **Activate / Deactivate** → Toggle switch with confirmation modal
- **View Customers** → Company's customer data

#### Admin Company Detail View

```
┌──────────────────────────────────────────────────┐
│  ← Back to Companies                             │
│                                                  │
│  TOTAL Fuel Station                              │
│  ─────────────────────────────────               │
│                                                  │
│  ┌──────────────────┐ ┌──────────────────┐      │
│  │ Company Details   │ │ Plan Status      │      │
│  │                   │ │                  │      │
│  │ Name: TOTAL Fuel  │ │ Plan: 30 days   │      │
│  │ Type: Fuel Station│ │ Status: Active  │      │
│  │ Reg#: NE-12345   │ │ Started: 01 Apr │      │
│  │ Email: ...        │ │ Expires: 01 May │      │
│  │ Phone: ...        │ │ Days Left: 18  │      │
│  │ WhatsApp: ...     │ │                  │      │
│  │ Address: ...      │ │ [Deactivate]    │      │
│  └──────────────────┘ └──────────────────┘      │
│                                                  │
│  Customer Data (247 customers)                   │
│  ┌──────────────────────────────────────────┐    │
│  │ [Table identical to company dashboard]   │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

#### Bulk Email Page

```
┌──────────────────────────────────────────────────┐
│  Send Promotional Email                          │
│  ─────────────────────                           │
│                                                  │
│  Recipients: Companies opted in (87 of 142)      │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ Subject *                                │    │
│  │ [                                      ] │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ Email Body *                             │    │
│  │                                          │    │
│  │ [Rich text editor area                 ] │    │
│  │ [B] [I] [U] [Link] [List]               │    │
│  │                                          │    │
│  │                                          │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [Preview Email]  [Send to All →]                │
│   secondary        primary                       │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 9. Animation & Transitions

### Principles

1. **Purposeful only** — animations should communicate state changes, not decorate
2. **Fast** — never exceed 300ms for UI transitions (keep at 150–200ms for most)
3. **Subtle** — ease-out curves, small scale changes, gentle fades

### Timing Tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `transition-fast` | 100ms | `ease-out` | Hover states, color changes |
| `transition-normal` | 200ms | `ease-out` | Dropdowns, modals, tooltips |
| `transition-slow` | 300ms | `ease-out` | Page transitions, sidebar expand/collapse |

### Specific Animations

| Element | Animation |
|---------|-----------|
| **Button hover** | Background color transition, 100ms |
| **Input focus** | Border color + shadow transition, 150ms |
| **Dropdown open** | Fade in + translateY(-4px → 0), 150ms |
| **Modal open** | Overlay fade in 150ms, content scale(0.95 → 1) + fade, 200ms |
| **Modal close** | Reverse of open, 150ms |
| **Toast enter** | Slide in from right + fade, 200ms |
| **Toast exit** | Fade out + slide right, 150ms |
| **Sidebar collapse** | Width transition, 300ms, ease-in-out |
| **Page route change** | No animation (instant swap — keep it fast) |
| **Stat card number** | Count up animation on first load, 600ms |
| **Success checkmark (QR form)** | Scale up + draw SVG path, 400ms |
| **Skeleton loading** | Pulse animation (opacity 0.5 → 1), 1.5s infinite |

### Loading States

| State | Pattern |
|-------|---------|
| **Initial page load** | Skeleton loaders matching content shape |
| **Button loading** | Spinner icon replaces text, button width locked |
| **Table loading** | 5 skeleton rows with pulsing gray bars |
| **Full page loading** | Centered spinner + "Loading..." text |

---

## 10. Accessibility

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|---------------|
| **Color contrast** | All text meets 4.5:1 ratio (body) or 3:1 (large text, 18px+) |
| **Focus indicators** | 2px `teal-500` outline with 2px offset on all interactive elements |
| **Keyboard navigation** | All interactive elements reachable via Tab, activated via Enter/Space |
| **Screen reader labels** | All icon-only buttons have `aria-label`, images have `alt` text |
| **Form labels** | Every input has a visible `<label>` with `htmlFor` binding |
| **Error messages** | Connected to inputs via `aria-describedby`, announced by screen readers |
| **Skip to content** | Hidden skip link as first focusable element |
| **Reduced motion** | Respect `prefers-reduced-motion` — disable all animations |

### Touch Target Sizes

- Minimum **44x44px** for all interactive elements on mobile
- Buttons, links, checkboxes, radio buttons — all meet this requirement
- Table rows: 52px height provides adequate touch target

---

## 11. Performance & Low-Bandwidth Considerations

### Bundle Optimization

| Strategy | Implementation |
|----------|---------------|
| **Code splitting** | `React.lazy()` for all route-level components |
| **Tree shaking** | Import only needed icons from Lucide: `import { Users } from 'lucide-react'` |
| **Font subsetting** | Load only Latin + Latin Extended (covers EN + FR) |
| **Image format** | SVG for icons/illustrations, WebP for photos with JPEG fallback |
| **Compression** | Gzip/Brotli on server, minified CSS/JS in production |

### Target Performance Budgets

| Metric | Target |
|--------|--------|
| **First Contentful Paint** | < 1.5s (4G), < 3s (3G) |
| **Largest Contentful Paint** | < 2.5s (4G), < 5s (3G) |
| **Total JS bundle (initial)** | < 150KB gzipped |
| **Total CSS** | < 30KB gzipped |
| **QR Form page weight** | < 100KB total (critical for mobile users) |

### Low-Bandwidth Patterns

1. **QR Form loads independently** — minimal JS, no sidebar/header overhead
2. **No auto-playing animations** on QR form page
3. **Inline critical CSS** for QR form page
4. **Pagination over infinite scroll** — user controls data loading
5. **Debounced search** — 300ms delay before API call
6. **Stale-while-revalidate** caching strategy for dashboard data

---

## 12. Bilingual (i18n) UI Patterns

### Language Switching

- **Toggle location:** Header bar, pill-style switch (EN | FR)
- **Persistence:** Language preference stored in `localStorage`, default based on browser locale
- **Switch behavior:** Instant, no page reload (react-i18next handles this)

### Text Length Handling

French text averages **15–20% longer** than English. Design for the longest string:

| English | French | Strategy |
|---------|--------|----------|
| "Dashboard" | "Tableau de bord" | Sidebar width accommodates longer labels |
| "Submit" | "Soumettre" | Buttons use horizontal padding, not fixed width |
| "Download PDF Report" | "Télécharger le rapport PDF" | Allow text wrapping in secondary actions |
| "QR Code" | "Code QR" | Some terms are shorter — don't assume FR is always longer |

### i18n Rules

1. **Never hardcode user-facing strings** — all text goes through `t()` function
2. **Use keys, not English strings** as i18n keys: `t('dashboard.title')` not `t('Dashboard')`
3. **Pluralization:** Use i18next's `count` parameter for proper FR pluralization
4. **Number formatting:** Use `Intl.NumberFormat` with locale (`fr-NE` or `en-NE`)
5. **Date formatting:** Use dayjs with locale for proper FR date formatting
6. **RTL:** Not needed (both EN and FR are LTR)

### Placeholder Translations

| Key | EN | FR |
|-----|-----|-----|
| `common.login` | Login | Connexion |
| `common.register` | Register | S'inscrire |
| `common.submit` | Submit | Soumettre |
| `common.cancel` | Cancel | Annuler |
| `common.save` | Save | Enregistrer |
| `common.delete` | Delete | Supprimer |
| `common.search` | Search... | Rechercher... |
| `common.loading` | Loading... | Chargement... |
| `dashboard.title` | Dashboard | Tableau de bord |
| `dashboard.totalCustomers` | Total Customers | Total clients |
| `dashboard.totalSpend` | Total Spend | Dépenses totales |
| `dashboard.topSpender` | Top Spender | Meilleur client |
| `dashboard.planStatus` | Plan Status | Statut du plan |
| `qrForm.title` | Record Your Purchase | Enregistrez votre achat |
| `qrForm.fullName` | Full Name | Nom complet |
| `qrForm.vehicleReg` | Vehicle Registration Number | Numéro d'immatriculation |
| `qrForm.invoiceNumber` | Invoice Number | Numéro de facture |
| `qrForm.invoiceAmount` | Invoice Amount | Montant de la facture |
| `qrForm.submit` | Submit Purchase | Soumettre l'achat |
| `qrForm.success` | Purchase Recorded! | Achat enregistré ! |
| `admin.companies` | Companies | Entreprises |
| `admin.visitors` | Website Visitors | Visiteurs du site |
| `admin.bulkEmail` | Bulk Email | Email groupé |
| `admin.activate` | Activate | Activer |
| `admin.deactivate` | Deactivate | Désactiver |

---

## Quick Reference: Tailwind Config Additions

```js
// tailwind.config.js — extend theme
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',  // ← main brand
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        accent: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',  // ← main accent
          600: '#EA580C',
          700: '#C2410C',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        h1: ['1.875rem', { lineHeight: '1.25', fontWeight: '700' }],
        h2: ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.35', fontWeight: '600' }],
        h4: ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
        'pulse-slow': 'pulse 1.5s ease-in-out infinite',
      },
    },
  },
};
```

---

*This document serves as the single source of truth for all UI/UX decisions in sena-temp. Every component, page, and interaction should reference this spec during implementation.*
