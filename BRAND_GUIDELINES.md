# SETI Brand Guidelines

## Overview

The SETI card list website uses a space-themed design system with a modern, sci-fi aesthetic. This document outlines the design principles, color palette, and usage guidelines to ensure visual consistency across the application.

## Design Philosophy

- **Deep Space Theme**: Dark, immersive backgrounds that evoke the vastness of space
- **Modern Sci-Fi**: Clean, futuristic design with subtle tech-inspired elements
- **No Blue-Purple**: Avoids clichéd sci-fi blue-purple color schemes in favor of distinctive cyan/teal and amber/gold accents
- **High Contrast**: Ensures readability with carefully balanced foreground/background relationships
- **Minimalist**: Clean layouts with purposeful use of space

## Color Palette

### Primary Colors

#### Space Series (Backgrounds & Neutrals)
The foundation of our color system, representing different depths of space.

| Name | Value | Usage |
|------|-------|-------|
| Space 50 | `#f8fafc` | Light mode backgrounds |
| Space 100 | `#f1f5f9` | Cards & surfaces |
| Space 200 | `#e2e8f0` | Borders & dividers |
| Space 300 | `#cbd5e1` | Muted text |
| Space 400 | `#94a3b8` | Secondary text |
| Space 500 | `#64748b` | Disabled elements |
| Space 600 | `#475569` | Dark mode muted backgrounds |
| Space 700 | `#334155` | Dark mode borders |
| Space 800 | `#1e293b` | Dark mode card backgrounds |
| Space 850 | `#171d29` | Dark mode elevated surfaces |
| Space 900 | `#0f172a` | Dark mode primary backgrounds |
| Space 950 | `#020617` | Deepest space, main background |

#### Primary (Cyan/Teal)
The main accent color, representing technology and discovery.

| Name | Value | Usage |
|------|-------|-------|
| Primary 50 | `#ecfdfe` | Light backgrounds |
| Primary 100 | `#d7fbfe` | Subtle highlights |
| Primary 200 | `#b0f6f8` | Soft backgrounds |
| Primary 300 | `#76eef3` | Hover states |
| Primary 400 | `#3ce1eb` | Links, active elements |
| Primary 500 | `#08b4c4` | Primary buttons, actions |
| Primary 600 | `#0691a1` | Pressed states |
| Primary 700 | `#05747f` | Darker accents |
| Primary 800 | `#055e65` | Secondary accents |
| Primary 900 | `#054e56` | Dark mode borders |
| Primary 950 | `#033237` | Deepest accents |

#### Accent (Amber/Gold)
Secondary accent for warmth and emphasis.

| Name | Value | Usage |
|------|-------|-------|
| Accent 50 | `#fffbeb` | Light backgrounds |
| Accent 100 | `#fef3c7` | Warning backgrounds |
| Accent 200 | `#fde68a` | Soft highlights |
| Accent 300 | `#fcd34d` | Hover states |
| Accent 400 | `#fbbf24` | Active warnings |
| Accent 500 | `#f59e0b` | Secondary actions |
| Accent 600 | `#d97706` | Warning states |
| Accent 700 | `#b45309` | Strong warnings |
| Accent 800 | `#92400e` | Dark warnings |
| Accent 900 | `#78350f` | Dark mode warning borders |
| Accent 950 | `#451a03` | Deepest warnings |

### Alien Faction Colors

Each alien faction has its own color scheme, enhanced for dark mode visibility.

| Faction | Primary | Foreground | Background | Dark |
|---------|---------|------------|------------|------|
| Anomalies | `#2dd4bf` | `#ccfbf1` | `#115e59` | `#0d9488` |
| Centaurians | `#10b981` | `#d1fae5` | `#065f46` | `#047857` |
| Exertians | `#ef4444` | `#fee2e2` | `#991b1b` | `#dc2626` |
| Mascamites | `#eab308` | `#fef9c3` | `#854d0e` | `#ca8a04` |
| Oumuamua | `#8b5cf6` | `#ede9fe` | `#5b21b6` | `#7c3aed` |
| Amoeba | `#f472b6` | `#fce7f3` | — | `#ec4899` |
| Glyphids | `#84cc16` | `#ecfccb` | `#3f6212` | `#65a30d` |

## Typography

### Font Families
- **Code/Display**: Source Code Pro (900 weight for headings)
- **Body**: System sans-serif (Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto)

### Text Colors
- **Primary Text**: Space 50 (light mode) / Space 100 (dark mode)
- **Secondary Text**: Space 400 / Space 300
- **Muted Text**: Space 500 / Space 400

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
```css
.bg-glow-primary   /* Cyan glow for primary elements */
.bg-glow-accent    /* Gold glow for accent elements */
.text-glow         /* Text glow effect */
```

#### Gradients
```css
.bg-gradient-dark  /* Deep space gradient */
```

#### Animations
```css
.animate-float     /* Gentle floating animation (3s) */
.animate-glow      /* Pulsing glow animation (2s) */
```

### Shadow System
- Cards: `shadow-lg shadow-space-950/20`
- Hover states: `shadow-xl shadow-space-950/30`
- Focus states: `shadow-[0_0_20px_theme("colors.primary.500/30")]`

## Component Guidelines

### Buttons
- **Primary**: Primary 500 background, Space 950 text
- **Secondary**: Space 700 background, Space 100 text
- **Destructive**: Accent 600 background, white text
- Hover: Add glow effect with corresponding color

### Cards
- Background: Space 900 (light mode: Space 50)
- Border: Space 700 (light mode: Space 200)
- Hover: Elevated with glow effect

### Links
- Color: Primary 400 (light mode: Primary 600)
- Hover: Primary 300 with underline

### Form Elements
- Background: Space 800
- Border: Space 700
- Focus: Primary 500 ring with glow
- Text: Space 100

## Accessibility

### Contrast Ratios
All color combinations meet WCAG 2.1 AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### Focus States
All interactive elements have visible focus states:
- Ring color: Primary 500
- Ring width: 2px
- Optional glow effect

## Usage Examples

### Primary Button
```tsx
<button className="bg-primary-500 text-space-950 hover:bg-primary-400 bg-glow-primary">
  Action
</button>
```

### Card
```tsx
<div className="bg-space-900 border border-space-700 rounded-lg shadow-lg">
  <h3 className="text-space-100">Card Title</h3>
</div>
```

### Input Field
```tsx
<input
  className="bg-space-800 border border-space-700 text-space-100 focus:ring-2 focus:ring-primary-500"
  placeholder="Search..."
/>
```

### Alien Badge
```tsx
<div className="bg-anomalies-background text-anomalies-foreground px-3 py-1 rounded-full">
  Anomalies
</div>
```

## Best Practices

1. **Dark Mode First**: Design primarily for dark mode, ensure light mode works as well
2. **Accent Sparingly**: Use primary/accent colors only for emphasis, not for backgrounds
3. **Hierarchy**: Use color size, and spacing to establish visual hierarchy
4. **Consistency**: Stick to the defined color palette, avoid custom colors
5. **Testing**: Always test in both light and dark modes

## Implementation

The design system is implemented through:
- Tailwind CSS configuration (`tailwind.config.ts`)
- Global styles (`src/styles/globals.css`)
- CSS custom properties for theming
- Component-specific utility classes

When adding new components or modifying existing ones, reference these guidelines to maintain consistency.
