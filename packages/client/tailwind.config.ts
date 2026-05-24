import type { Config } from 'tailwindcss';
import { THEME_TOKENS } from './src/config/theme';

/**
 * Tailwind config for the SETI client.
 * Token shape matches `THEME_TOKENS` — keep existing numbered scales (500, 800…)
 * for backwards compatibility with ~50 consuming components.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: THEME_TOKENS.colors.background,
        surface: {
          // Five-level surface system (impeccable.md §Surface System)
          void: THEME_TOKENS.colors.surface.void,
          deep: THEME_TOKENS.colors.surface.deep,
          panel: THEME_TOKENS.colors.surface.panel,
          raised: THEME_TOKENS.colors.surface.raised,
          instrument: THEME_TOKENS.colors.surface.instrument,
          // Legacy numeric scale
          900: THEME_TOKENS.colors.surface[900],
          800: THEME_TOKENS.colors.surface[800],
          700: THEME_TOKENS.colors.surface[700],
        },
        text: {
          100: THEME_TOKENS.colors.text[100],
          300: THEME_TOKENS.colors.text[300],
          500: THEME_TOKENS.colors.text[500],
          700: THEME_TOKENS.colors.text[700],
        },
        accent: THEME_TOKENS.colors.accent,
        danger: THEME_TOKENS.colors.danger,
        metal: {
          highlight: THEME_TOKENS.colors.metal.highlight,
          face: THEME_TOKENS.colors.metal.face,
          shadow: THEME_TOKENS.colors.metal.shadow,
          edge: THEME_TOKENS.colors.metal.edge,
          edgeSoft: THEME_TOKENS.colors.metal.edgeSoft,
        },
        data: THEME_TOKENS.colors.data,
        // Signal palette — meaning-bound accents
        signal: {
          blue: THEME_TOKENS.colors.signal.blue.base,
          'blue-hi': THEME_TOKENS.colors.signal.blue.hi,
          'blue-lo': THEME_TOKENS.colors.signal.blue.lo,
          violet: THEME_TOKENS.colors.signal.violet.base,
          'violet-hi': THEME_TOKENS.colors.signal.violet.hi,
          'violet-lo': THEME_TOKENS.colors.signal.violet.lo,
          green: THEME_TOKENS.colors.signal.green.base,
          'green-hi': THEME_TOKENS.colors.signal.green.hi,
          'green-lo': THEME_TOKENS.colors.signal.green.lo,
          amber: THEME_TOKENS.colors.signal.amber.base,
          'amber-hi': THEME_TOKENS.colors.signal.amber.hi,
          'amber-lo': THEME_TOKENS.colors.signal.amber.lo,
          red: THEME_TOKENS.colors.signal.red.base,
          'red-hi': THEME_TOKENS.colors.signal.red.hi,
          'red-lo': THEME_TOKENS.colors.signal.red.lo,
          white: THEME_TOKENS.colors.signal.white,
        },
      },
      fontFamily: {
        display: [
          THEME_TOKENS.typography.display,
          'ui-sans-serif',
          'sans-serif',
        ],
        body: [THEME_TOKENS.typography.body, 'ui-sans-serif', 'sans-serif'],
        mono: [
          THEME_TOKENS.typography.mono,
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      letterSpacing: {
        readout: '0.02em',
        microlabel: '0.12em',
        wordmark: '0.18em',
      },
      boxShadow: {
        panel: THEME_TOKENS.effects.panelShadow,
        'metal-face':
          'inset 0 1px 0 oklch(0.78 0.07 240 / 0.5), inset 0 -1px 0 oklch(0.22 0.05 240 / 0.6), 0 1px 0 oklch(0.08 0.018 260 / 0.8), 0 0 0 1px oklch(0.20 0.04 240 / 0.4)',
        'metal-face-hover':
          'inset 0 1px 0 oklch(0.82 0.07 240 / 0.6), inset 0 -1px 0 oklch(0.22 0.05 240 / 0.6), 0 1px 0 oklch(0.08 0.018 260 / 0.8), 0 0 0 1px oklch(0.24 0.05 240 / 0.5)',
        'metal-face-active':
          'inset 0 1px 2px oklch(0.12 0.04 240 / 0.7), inset 0 -1px 0 oklch(0.60 0.08 240 / 0.4), 0 0 0 1px oklch(0.18 0.04 240 / 0.5)',
        'hairline-inset': 'inset 0 1px 0 oklch(0.78 0.04 240 / 0.22)',
        instrument:
          '0 1px 0 oklch(0.32 0.035 260 / 0.6) inset, 0 0 0 1px oklch(0.28 0.035 260 / 0.8), 0 12px 32px oklch(0.05 0.015 260 / 0.55)',
        'focus-ring':
          '0 0 0 2px oklch(0.10 0.02 260), 0 0 0 4px oklch(0.68 0.11 240 / 0.5)',
        'glow-blue':
          '0 0 8px oklch(0.68 0.11 240 / 0.6), 0 0 24px oklch(0.68 0.11 240 / 0.20)',
        'glow-violet':
          '0 0 8px oklch(0.62 0.14 305 / 0.6), 0 0 24px oklch(0.62 0.14 305 / 0.25)',
        'glow-green':
          '0 0 6px oklch(0.78 0.13 155 / 0.55), 0 0 20px oklch(0.78 0.13 155 / 0.18)',
        'glow-amber':
          '0 0 6px oklch(0.78 0.13 75 / 0.55), 0 0 20px oklch(0.78 0.13 75 / 0.18)',
        'glow-red':
          '0 0 8px oklch(0.65 0.18 25 / 0.6), 0 0 22px oklch(0.65 0.18 25 / 0.22)',
      },
      backgroundImage: {
        'metal-face':
          'linear-gradient(to bottom, oklch(0.58 0.10 240) 0%, oklch(0.50 0.09 240) 50%, oklch(0.44 0.08 240) 100%)',
        'metal-face-hover':
          'linear-gradient(to bottom, oklch(0.62 0.10 240) 0%, oklch(0.54 0.09 240) 50%, oklch(0.48 0.08 240) 100%)',
        'metal-face-pressed':
          'linear-gradient(to bottom, oklch(0.44 0.08 240) 0%, oklch(0.50 0.09 240) 55%, oklch(0.56 0.10 240) 100%)',
        'metal-face-danger':
          'linear-gradient(to bottom, oklch(0.60 0.15 28) 0%, oklch(0.52 0.15 28) 50%, oklch(0.44 0.13 28) 100%)',
      },
      ringColor: {
        DEFAULT: 'oklch(0.68 0.11 240)',
      },
      keyframes: {
        'instrument-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'overlay-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'panel-rise': {
          '0%': { opacity: '0', transform: 'translateY(6px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'signal-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'instrument-fade-in':
          'instrument-fade-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'overlay-fade-in':
          'overlay-fade-in 160ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'panel-rise': 'panel-rise 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'signal-pulse': 'signal-pulse 2.4s ease-in-out infinite',
      },
    },
  },
};

export default config;
