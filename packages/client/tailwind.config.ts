import type { Config } from 'tailwindcss';
import { THEME_TOKENS } from './src/config/theme';

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
      },
      fontFamily: {
        display: [THEME_TOKENS.typography.display, 'serif'],
        body: [THEME_TOKENS.typography.body, 'sans-serif'],
      },
      boxShadow: {
        panel: THEME_TOKENS.effects.panelShadow,
      },
    },
  },
};

export default config;
