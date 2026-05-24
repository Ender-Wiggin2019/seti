/**
 * Design tokens for SETI.
 * Palette is OKLCH-native; see `.impeccable.md` (root of repo) for the full rationale.
 *
 * The tokens model the Space Agencies mission interface in three concentric rings:
 *   1. Surface system  — five lightness levels lifting off the void.
 *   2. Signal palette  — meaning-bound accents (blue/violet/green/amber/red/white).
 *   3. Metal & motion  — mechanical chrome and timing.
 */

export interface IThemeTokens {
  colors: {
    /**
     * Background void — the page backdrop. Used by the cosmic-atmosphere
     * layer; almost never as a component fill.
     */
    background: {
      950: string;
      900: string;
      800: string;
    };
    /** Five-level surface system (see .impeccable.md §Surface System). */
    surface: {
      /** The very base, behind atmosphere. Component fill: never. */
      void: string;
      /** App chrome — top bar, side rails. First lift off the void. */
      deep: string;
      /** Default panel and card fill. The workhorse. */
      panel: string;
      /** Modals, popovers, dropdowns — floats above panels. */
      raised: string;
      /** Inset readouts; darker than its container, like a recessed display. */
      instrument: string;
      /** Legacy numbered scale — kept for the ~50 consumers still using it. */
      900: string;
      800: string;
      700: string;
    };
    text: {
      /** Phosphor white — primary readouts, labels of high importance. */
      100: string;
      /** Body copy. */
      300: string;
      /** Captions, dim labels, mission-log connective tissue. */
      500: string;
      /** Even dimmer — disabled, decorative dividers. */
      700: string;
    };
    /**
     * Signal palette — six meaning-bound accents.
     * A color earns its place by meaning, not aesthetics.
     */
    signal: {
      /** 🔷 Anodized Blue — player agency, primary actions, focus, current selection. */
      blue: { base: string; hi: string; lo: string };
      /** 🟣 Nebula Violet — discovery events, new signals, alien encounters. The 'awe' accent. */
      violet: { base: string; hi: string; lo: string };
      /** 🟢 Ion Green — confirmed / acquired / nominal. Diagnostics only, never on buttons. */
      green: { base: string; hi: string; lo: string };
      /** 🟡 Signal Amber — caution, pending action, decaying resource. Telemetry warnings. */
      amber: { base: string; hi: string; lo: string };
      /** 🔴 Plasma Red — critical failure, destructive confirm, mission abort. */
      red: { base: string; hi: string; lo: string };
      /** ⚪ Phosphor White — data readouts. Plain, mono, never another color. */
      white: string;
    };
    /** Anodized blue legacy alias — kept for back-compat with existing components. */
    accent: { 500: string; 400: string; 600: string };
    /** Destructive-only — kept as alias for signal.red.base. */
    danger: { 500: string };
    /** Metal bevel palette. */
    metal: {
      highlight: string;
      face: string;
      shadow: string;
      edge: string;
      edgeSoft: string;
    };
    /** Instrumentation / data readouts — plain near-white phosphor. */
    data: { primary: string; dim: string };
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
    /** Soft contact shadow for elevated panels. */
    panelShadow: string;
    /** Cosmic atmosphere — three layers (void gradient + starfield + dust lane). */
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
      void: 'oklch(0.10 0.02 260)',
      deep: 'oklch(0.15 0.028 262)',
      panel: 'oklch(0.19 0.032 262)',
      raised: 'oklch(0.24 0.036 262)',
      instrument: 'oklch(0.13 0.025 258)',
      // Legacy numeric scale
      900: 'oklch(0.17 0.025 260)',
      800: 'oklch(0.20 0.028 260)',
      700: 'oklch(0.28 0.035 260)',
    },
    text: {
      100: 'oklch(0.96 0.008 260)',
      300: 'oklch(0.72 0.015 260)',
      500: 'oklch(0.52 0.02 260)',
      700: 'oklch(0.38 0.018 260)',
    },
    signal: {
      blue: {
        base: 'oklch(0.68 0.11 240)',
        hi: 'oklch(0.78 0.10 240)',
        lo: 'oklch(0.50 0.09 240)',
      },
      violet: {
        base: 'oklch(0.62 0.14 305)',
        hi: 'oklch(0.74 0.13 305)',
        lo: 'oklch(0.48 0.12 305)',
      },
      green: {
        base: 'oklch(0.78 0.13 155)',
        hi: 'oklch(0.86 0.12 155)',
        lo: 'oklch(0.58 0.12 155)',
      },
      amber: {
        base: 'oklch(0.78 0.13 75)',
        hi: 'oklch(0.86 0.13 75)',
        lo: 'oklch(0.58 0.12 75)',
      },
      red: {
        base: 'oklch(0.65 0.18 25)',
        hi: 'oklch(0.74 0.18 25)',
        lo: 'oklch(0.50 0.16 25)',
      },
      white: 'oklch(0.96 0.008 260)',
    },
    accent: {
      500: 'oklch(0.68 0.11 240)',
      400: 'oklch(0.74 0.10 240)',
      600: 'oklch(0.58 0.10 240)',
    },
    danger: { 500: 'oklch(0.65 0.18 25)' },
    metal: {
      highlight: 'oklch(0.78 0.07 240)',
      face: 'oklch(0.50 0.09 240)',
      shadow: 'oklch(0.28 0.06 240)',
      edge: 'oklch(0.34 0.035 240)',
      edgeSoft: 'oklch(0.28 0.035 260)',
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
      'radial-gradient(ellipse 120% 80% at 38% 28%, oklch(0.16 0.035 280) 0%, oklch(0.12 0.025 265) 45%, oklch(0.08 0.018 255) 100%)',
  },
};
