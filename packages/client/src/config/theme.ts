/**
 * Design tokens for the SETI client.
 * Palette is OKLCH-native; see `.impeccable.md` (root of repo) for the full rationale.
 *
 * All colors are tinted toward hue 260 (blue-violet void) for surfaces / 240 (anodized blue)
 * for chrome accents. Never pure #000 or #fff — the void is tinted.
 */

export interface IThemeTokens {
  colors: {
    background: {
      /** Deepest void — page backdrop. */
      950: string;
      /** Primary app surface. */
      900: string;
      /** Elevated surface (hover, focus ring offset). */
      800: string;
    };
    surface: {
      /** Panel fill on top of background. */
      900: string;
      /** Panel fill, elevated. */
      800: string;
      /** Panel border / divider neutral. */
      700: string;
    };
    text: {
      /** Primary text — off-white, faintly tinted toward the base hue. */
      100: string;
      /** Secondary / body. */
      300: string;
      /** Dim, captions, placeholder. */
      500: string;
    };
    /** Anodized blue — the ONE chrome accent. Player agency, CTAs, focus. */
    accent: {
      /** Base / default. */
      500: string;
      /** Hover (brighter). */
      400: string;
      /** Active / pressed (darker). */
      600: string;
    };
    /** Destructive-only color. Never as chrome accent. */
    danger: {
      500: string;
    };
    /**
     * Metal bevel colors — used to compose `border-image` and inset highlights
     * for the hairline-metal + metal-face techniques.
     */
    metal: {
      /** Catches light at the top edge. */
      highlight: string;
      /** Mid-face base. */
      face: string;
      /** Lower bevel shadow. */
      shadow: string;
      /** Default hairline border color (paired with inset highlight). */
      edge: string;
    };
    /** Instrumentation / data readouts — plain near-white phosphor. */
    data: {
      primary: string;
      dim: string;
    };
  };
  typography: {
    /** Wide geometric display — screen titles, phase names, end-of-game reveals. */
    display: string;
    /** Neutral engineered sans — body, UI chrome, buttons, labels. */
    body: string;
    /** Monospaced readouts — coordinates, resource counts, timestamps, logs. */
    mono: string;
  };
  effects: {
    /** Soft contact shadow for elevated panels (metal sits on dark, doesn't glow). */
    panelShadow: string;
    /** Ambient background atmosphere layered behind the app shell. */
    overlayGradient: string;
  };
}

export const THEME_TOKENS: IThemeTokens = {
  colors: {
    background: {
      950: 'oklch(0.08 0.018 260)',
      900: 'oklch(0.11 0.02 260)',
      800: 'oklch(0.14 0.022 260)',
    },
    surface: {
      900: 'oklch(0.17 0.025 260)',
      800: 'oklch(0.20 0.028 260)',
      700: 'oklch(0.28 0.035 260)',
    },
    text: {
      100: 'oklch(0.96 0.008 260)',
      300: 'oklch(0.72 0.015 260)',
      500: 'oklch(0.52 0.02 260)',
    },
    accent: {
      500: 'oklch(0.68 0.11 240)',
      400: 'oklch(0.74 0.10 240)',
      600: 'oklch(0.58 0.10 240)',
    },
    danger: {
      500: 'oklch(0.65 0.16 28)',
    },
    metal: {
      highlight: 'oklch(0.78 0.07 240)',
      face: 'oklch(0.50 0.09 240)',
      shadow: 'oklch(0.28 0.06 240)',
      edge: 'oklch(0.34 0.035 240)',
    },
    data: {
      primary: 'oklch(0.96 0.008 260)',
      dim: 'oklch(0.72 0.015 260)',
    },
  },
  typography: {
    display: 'Unbounded',
    body: 'Hanken Grotesk',
    mono: 'JetBrains Mono',
  },
  effects: {
    panelShadow:
      '0 1px 0 oklch(0.32 0.035 260 / 0.6) inset, 0 10px 28px oklch(0.05 0.015 260 / 0.55)',
    overlayGradient:
      'radial-gradient(1400px 700px at 15% -10%, oklch(0.22 0.05 240 / 0.22), transparent 55%), radial-gradient(1200px 800px at 90% 110%, oklch(0.18 0.06 280 / 0.18), transparent 55%)',
  },
};
