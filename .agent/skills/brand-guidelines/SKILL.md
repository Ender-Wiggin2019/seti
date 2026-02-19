---
name: brand-guidelines
description: Brand design system for Terraforming Mars (TFM). Use when building or styling any frontend page/component in this project. Defines the visual language — colors, typography, spacing, component patterns — for a dark sci-fi Mars colonization theme.
---

# TFM Brand Guidelines v2

## Aesthetic Direction

**High-tech Mars colonization command center** — the feeling of a cutting-edge mission control interface overlaid on the dark Martian sky. Deep, atmospheric, with luminous data displays and holographic-inspired UI elements. Think: deep space meets neon-traced engineering blueprints.

### Design Pillars
1. **Contrast & Legibility**: Text must always stand out clearly against backgrounds. Use high-contrast pairings (bright text on dark surfaces, vivid accents on muted panels).
2. **Layered Depth**: Multiple background layers with subtle gradients and glow effects create a sense of depth and atmosphere.
3. **Technical Precision**: Monospace data readouts, angular clip-paths, HUD-style corner accents, and scan-line effects evoke a command console.
4. **Modern Gradients**: Use multi-stop gradients, mesh-style color blends, and translucent overlays for a premium, current feel.

## Color Palette

All colors are defined as Tailwind CSS custom values in `tailwind.config.js` under `theme.extend.colors.mars`.

### Core Palette (Backgrounds)

| Token              | Value       | Usage                                     |
|--------------------|-------------|-------------------------------------------|
| `mars-void`        | `#0a0e1a`   | Deepest background (page body)            |
| `mars-deep`        | `#111a2e`   | Card / panel background                   |
| `mars-surface`     | `#1a2540`   | Elevated surfaces, hover states           |
| `mars-border`      | `#263050`   | Borders, dividers, subtle lines           |

### Accent Colors

| Token              | Value       | Usage                                     |
|--------------------|-------------|-------------------------------------------|
| `mars-rust`        | `#e2520e`   | Primary accent — Mars surface orange (brighter) |
| `mars-amber`       | `#f59e0b`   | Warm highlight — gold/amber actions       |
| `mars-ember`       | `#f97316`   | Hover state for primary accent            |
| `mars-sand`        | `#c48b5c`   | Muted warm tone — tags, secondary info    |

### Functional Colors

| Token              | Value       | Usage                                     |
|--------------------|-------------|-------------------------------------------|
| `mars-cyan`        | `#22d3ee`   | Technology / info — links, data highlights (brighter) |
| `mars-teal`        | `#2dd4bf`   | Success / positive state (brighter)       |
| `mars-red`         | `#ef4444`   | Error / destructive actions               |
| `mars-yellow`      | `#facc15`   | Warning / confirming state                |

### Text Hierarchy (High Contrast)

| Token              | Value       | Usage                                     |
|--------------------|-------------|-------------------------------------------|
| `mars-text`        | `#f1f5f9`   | Primary body text — near white            |
| `mars-text-dim`    | `#cbd5e1`   | Secondary text — clearly readable         |
| `mars-text-faint`  | `#94a3b8`   | Tertiary / labels — still readable        |

## Typography

- **Font Family**: `Ubuntu, sans-serif` (consistent with existing game UI)
- **Headings**: Bold, uppercase, tracking-wide. Use `mars-text` color.
- **Body**: Regular weight, line-height 1.5–1.6. Use `mars-text` or `mars-text-dim`.
- **Data/Counts**: `font-mono` (monospace), semi-bold for numerical emphasis.
- **Labels**: Uppercase, tracking-widest, `text-xs`, `mars-text-faint`.

## Page Layout

### Shared Navigation Bar
All non-game pages share a top navigation bar (`NavBar.vue`) that provides:
- **Back button** (left) — navigates to previous page via `history.back()`
- **Brand logo** — "TERRAFORMING MARS" text, links to home
- **Navigation links** (center) — Lobby, My Games, Ranks, Cards
- **User area** (right) — username + avatar if logged in, or Login link

The NavBar uses a glass-morphism style with:
```
background: rgba(10, 14, 26, 0.85)
backdrop-filter: blur(12px)
border-bottom: 1px solid mars-border
```

### Page Background
Every page uses the shared Mars background pattern:
```css
background-color: mars-void;
background-image:
  radial-gradient(ellipse at 50% -10%, rgba(226,82,14,0.12) 0%, transparent 50%),
  radial-gradient(ellipse at 80% 90%, rgba(34,211,238,0.05) 0%, transparent 40%),
  linear-gradient(rgba(38,48,80,0.3) 1px, transparent 1px),
  linear-gradient(90deg, rgba(38,48,80,0.3) 1px, transparent 1px);
background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
```

### Content Container
All page content wraps in `max-w-5xl mx-auto` with appropriate padding.
Pages should add `pt-4` padding since the NavBar occupies the top.

## Component Patterns

### Cards (Room / Panel)
```
bg: mars-deep
border: 1px solid mars-border
clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))
box-shadow: 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)
hover: border-color transitions to mars-rust/40
```

### HUD Corner Accents
Used on panels and cards to give a sci-fi command console feel:
```css
.corner--tl { top: 0; left: 0; border-top + border-left: 2px solid mars-rust/60 }
.corner--br { bottom: 0; right: 0; border-bottom + border-right: 2px solid mars-rust/40 }
```

### HUD Divider Line
A gradient line used as section divider:
```css
height: 1px;
background: linear-gradient(to right, mars-rust, mars-rust/30 25%, mars-border/50 55%, transparent);
```

### Buttons
- **Primary**: `bg-gradient-to-r from-mars-rust to-mars-ember text-white` — main CTA, with glow shadow
- **Secondary**: `bg-mars-surface hover:bg-mars-border text-mars-text-dim hover:text-mars-text` — neutral
- **Success/Join**: `text-mars-teal border-mars-teal/50 hover:bg-mars-teal/15` — join / confirm
- **Danger**: `text-mars-red border-mars-red/30 hover:bg-mars-red/15` — kick / close / destructive
- **All buttons**: `px-4 py-2 font-medium transition-all duration-200`
- Angular clip-path on primary CTAs for extra sci-fi feel

### Badges / Tags
- **Setting tag**: `bg-mars-surface/80 text-mars-sand border border-mars-border/60 text-xs font-medium`
- **Status badge**: Colored per status with matching border, uppercase, mono font, tiny

### Player Slots
- Filled: Use existing `player_translucent_bg_color_*` classes
- Empty: `border border-dashed border-mars-border/80 text-mars-text-faint`

### Tables
- Header: `text-xs uppercase tracking-wider text-mars-text-faint font-mono border-b border-mars-border`
- Rows: `border-b border-mars-border/30 hover:bg-mars-surface/40 transition-colors`
- Cell text: `text-mars-text` for primary data, `text-mars-text-dim` for secondary

### Tabs
- Angular clip-path style matching the sci-fi theme
- Active: `bg-mars-deep text-mars-text border-mars-border/60` with bottom accent line in mars-rust
- Inactive: `text-mars-text-dim hover:text-mars-text hover:bg-mars-deep/50`

## Atmosphere Effects

- **Page glow**: Radial gradient from top-center (warm rust) and bottom-right (cool cyan), very subtle
- **Grid overlay**: Fine 40px grid lines using mars-border/30 for the "blueprint" effect
- **Card glow**: Active/highlighted cards emit subtle colored glow via box-shadow
- **Scan-line animation**: Optional animated scan line on loading states
- **Pulsing dots**: HUD status indicators with subtle pulse animation

## Spacing Scale

Follow Tailwind defaults. Use generous padding on cards (`px-5 py-4`) and compact inner elements. Maintain consistent gap values (gap-3 for related items, gap-5 for sections).

## Responsive Breakpoints

- Mobile-first design
- Cards: single column on mobile, 2-column grid on `lg:`
- Navigation: horizontal scroll or hamburger on small screens
- Header controls: wrap on small screens (`flex-wrap`)

## Important Constraints

- **NEVER modify game card styles** (anything in `cards.less` or card components like `Card.vue`).
- Card-list pages should only have their layout/wrapper styled, not the cards themselves.
- Maintain backward compatibility with existing `player_bg_color_*` and game-related CSS classes.
