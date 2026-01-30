---
name: brand-guidelines
description: Applies SETI's official space-themed design system with deep black backgrounds and metallic silver/ice cyan accents. Use it when brand colors, visual formatting, or design standards apply to SETI-related artifacts.
license: Complete terms in LICENSE.txt
---

# SETI Brand Styling

## Overview

Applies SETI's space-themed design system to any artifact that requires the official SETI look-and-feel. The design system features deep space black backgrounds with stellar silver metallic primary accents and ice cyan secondary accents for a sophisticated, modern sci-fi aesthetic.

**Keywords**: branding, corporate identity, visual identity, post-processing, styling, brand colors, typography, SETI brand, visual formatting, visual design, space theme, sci-fi design, metallic, silver

## Design Philosophy

- **Deep Space Black**: Pure dark backgrounds that evoke the infinite vastness of space
- **Metallic Sophistication**: Silver and steel tones for a refined, high-tech aesthetic
- **Cool Minimalism**: Ice cyan accents used sparingly for futuristic highlights
- **No Blue-Purple or Orange**: Avoids clichéd sci-fi colors in favor of distinctive silver metallic and ice cyan
- **High Contrast**: Ensures readability with carefully balanced foreground/background relationships
- **Modern & Clean**: Sleek layouts with purposeful use of space and metallic textures

## Theme System

SETI supports two accent color themes, both using the same deep space black base:

### Theme 1: Stellar Silver (星际银色) - Default
Metallic, sophisticated - inspired by spacecraft hulls and advanced technology.

- **Accent Color**: #9ca3af (Silver 400)
- **Character**: Sophisticated, metallic, professional
- **Use for**: Links, decorative borders, hover states, metallic glows

### Theme 2: Ice Cyan (冰晶青色)
Cool, futuristic - inspired by cryogenic systems and deep space ice.

- **Accent Color**: #67e8f9 (Ice 300)
- **Character**: Cool, futuristic, ethereal
- **Use for**: Links, decorative borders, hover states, subtle glows

## IMPORTANT: Accent Color Usage Rules

**DO use accent colors for:**
- Links and interactive elements
- Decorative borders and dividers
- Background glows and gradients (subtle)
- Hover/focus states
- Icons when they need emphasis
- Selection highlights

**DO NOT use accent colors for:**
- Main headings/titles (use space-50 or space-100)
- Body text (use space-200 or space-300)
- Large text blocks
- Backgrounds (except subtle glows)

## Color Palette

### Space Series (Backgrounds & Neutrals)
The foundation of the color system - deep black neutrals for maximum depth.

- Space 50: `#fafafa` - Light mode backgrounds
- Space 100: `#f4f4f5` - Cards & surfaces
- Space 200: `#e4e4e7` - Borders & dividers
- Space 300: `#d4d4d8` - Muted text
- Space 400: `#a1a1aa` - Secondary text
- Space 500: `#71717a` - Disabled elements
- Space 600: `#52525b` - Dark mode muted backgrounds
- Space 700: `#3f3f46` - Dark mode borders
- Space 800: `#27272a` - Dark mode card backgrounds
- Space 850: `#1c1c1f` - Dark mode elevated surfaces
- Space 900: `#141416` - Dark mode primary backgrounds
- Space 950: `#0a0a0b` - Deepest space, main background

### Stellar Silver Colors
The primary accent - metallic silver for sophisticated highlights.

- Silver 50: `#f9fafb` - Light backgrounds
- Silver 100: `#f3f4f6` - Subtle highlights
- Silver 200: `#e5e7eb` - Soft backgrounds
- Silver 300: `#d1d5db` - Hover states
- Silver 400: `#9ca3af` - Links, active elements (DEFAULT)
- Silver 500: `#6b7280` - Primary buttons, actions
- Silver 600: `#4b5563` - Pressed states
- Silver 700: `#374151` - Darker accents
- Silver 800: `#1f2937` - Secondary accents
- Silver 900: `#111827` - Dark mode borders
- Silver 950: `#030712` - Deepest accents

### Ice Cyan Colors
Secondary accent - cool cyan for futuristic highlights.

- Ice 50: `#ecfeff` - Light backgrounds
- Ice 100: `#cffafe` - Subtle highlights
- Ice 200: `#a5f3fc` - Soft backgrounds
- Ice 300: `#67e8f9` - Hover states (DEFAULT)
- Ice 400: `#22d3ee` - Active elements
- Ice 500: `#06b6d4` - Secondary actions
- Ice 600: `#0891b2` - Pressed states
- Ice 700: `#0e7490` - Darker accents
- Ice 800: `#155e75` - Dark accents
- Ice 900: `#164e63` - Dark mode borders
- Ice 950: `#083344` - Deepest accents

### Alien Faction Colors

Each alien faction has its own color scheme, enhanced for dark mode visibility.

- **Anomalies**: `#2dd4bf` (primary), `#ccfbf1` (foreground), `#115e59` (background)
- **Centaurians**: `#10b981` (primary), `#d1fae5` (foreground), `#065f46` (background)
- **Exertians**: `#ef4444` (primary), `#fee2e2` (foreground), `#991b1b` (background)
- **Mascamites**: `#eab308` (primary), `#fef9c3` (foreground), `#854d0e` (background)
- **Oumuamua**: `#8b5cf6` (primary), `#ede9fe` (foreground), `#5b21b6` (background)
- **Amoeba**: `#f472b6` (primary), `#fce7f3` (foreground)
- **Glyphids**: `#84cc16` (primary), `#ecfccb` (foreground), `#3f6212` (background)

## Typography

### Font Families
- **Code/Display**: Source Code Pro (900 weight for headings)
- **Body**: System sans-serif (Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto)

### Text Colors
- **Primary Text**: Space 50 / Space 100 (depending on context)
- **Secondary Text**: Space 300 / Space 400
- **Muted Text**: Space 400 / Space 500

## Spacing & Layout

### Container Widths
- Mobile: Full width with padding
- Tablet: `max-w-3xl` (768px)
- Desktop: `max-w-4xl` (896px)
- Wide: `max-w-6xl` (1152px)

### Border Radius
- Small: `0.25rem` (4px)
- Medium: `0.375rem` (6px) - default
- Large: `0.5rem` (8px)

## Effects & Animations

### Utility Classes

#### Glow Effects
- `.bg-glow-primary` - Theme-aware primary glow
- `.bg-glow-accent` - Theme-aware accent glow
- `.text-glow` - Text glow effect
- `.text-glow-accent` - Accent text glow

#### Glass Effects
- `.bg-glass` - Subtle glass morphism
- `.bg-glass-elevated` - Elevated glass with more blur

#### Metallic Effects
- `.metallic-surface` - Subtle metallic gradient surface
- `.metallic-border` - Gradient metallic border
- `.metallic-text` - Metallic text gradient

#### Space Effects
- `.space-depth` - Layered space background

#### Border Effects
- `.border-glow` - Gradient border glow

#### Gradients
- `.bg-gradient-dark` - Deep space gradient

#### Animations
- `.animate-float` - Gentle floating animation (3s)
- `.animate-glow` - Pulsing glow animation (2s)
- `.animate-pulse-soft` - Soft pulse animation
- `.animate-metallic-shine` - Metallic shine sweep (3s)
- `.shimmer` - Shimmer loading effect

### Shadow System
- Cards: `shadow-lg shadow-space-950/20`
- Hover states: `shadow-xl shadow-space-950/30`
- Metallic: `shadow-metallic` or `shadow-metallic-lg`
- Glow: `shadow-glow-ice` or `shadow-glow-silver`
- Focus states: Theme-aware glow using CSS variables

## Component Guidelines

### Buttons
- **Primary**: Theme primary color background, dark text
- **Secondary**: Space 700 background, Space 100 text
- **Destructive**: Red background, white text
- Hover: Add glow effect with corresponding color

### Cards
- Background: Space 900/60 with backdrop-blur
- Border: Space 700/30 ring
- Hover: Elevated with metallic glow effect

### Links
- Color: Theme primary with 90% opacity
- Decoration: Subtle underline with primary/30
- Hover: Full opacity with primary/60 underline

### Form Elements
- Background: Space 800
- Border: Space 700
- Focus: Theme primary ring with glow
- Text: Space 100

### Markdown/Prose
- Headers: Space 50/100 with semibold weight
- Body: Space 300 with comfortable line height
- Blockquotes: Gradient background with primary border
- Code: Space 800/80 background with primary text

## Best Practices

1. **Dark Mode First**: Design primarily for dark mode
2. **Theme Consistency**: Use CSS variables for theme-aware colors
3. **Metallic Restraint**: Use metallic effects sparingly for emphasis
4. **Accent Sparingly**: Use primary/accent colors only for emphasis
5. **Hierarchy**: Use color, size, and spacing to establish visual hierarchy
6. **Consistency**: Stick to the defined color palette, avoid custom colors
7. **Testing**: Test in both themes (Stellar Silver and Ice Cyan)

## Technical Details

### Theme Switching
Theme switching is handled via:
- CSS classes on `<html>`: `dark theme-silver` or `dark theme-ice`
- `data-theme` attribute for JavaScript access
- ThemeContext React context for components
- localStorage persistence with key `seti-color-theme`

### Tailwind Configuration
The design system is implemented through Tailwind CSS configuration:
- Custom color definitions in `tailwind.config.ts`
- Dark mode support with `darkMode: 'class'`
- Extended theme with custom animations and utilities
- Theme-specific colors (silver, ice) alongside CSS variable-based primary

### CSS Variables
CSS custom properties for theming:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--primary-50` through `--primary-950` (full scale)
- `--accent`, `--accent-foreground`
- `--muted`, `--muted-foreground`
- `--border`, `--input`, `--ring`

### Component Integration
When adding new components:
- Use CSS variable colors (e.g., `text-primary`, `bg-primary/10`)
- Use theme-specific classes when needed (e.g., `text-silver-300`, `text-ice-300`)
- Consider metallic effects for interactive elements
- Maintain accessibility with proper contrast ratios
- Test in both Stellar Silver and Ice Cyan themes
