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
        surface: THEME_TOKENS.colors.surface,
        text: THEME_TOKENS.colors.text,
        accent: THEME_TOKENS.colors.accent,
        danger: THEME_TOKENS.colors.danger,
        metal: THEME_TOKENS.colors.metal,
        data: THEME_TOKENS.colors.data,
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
        microlabel: '0.14em',
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
          '0 0 0 2px oklch(0.11 0.02 260), 0 0 0 4px oklch(0.68 0.11 240 / 0.9)',
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
      },
      animation: {
        'instrument-fade-in':
          'instrument-fade-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'overlay-fade-in':
          'overlay-fade-in 160ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'panel-rise': 'panel-rise 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
};

export default config;
