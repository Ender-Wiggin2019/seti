/*
 * @Author: Ender-Wiggin
 * @Date: 2023-07-05 03:08:32
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-27 00:49:28
 * @Description:
 */
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: '#02adc4',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#02adc4',
          foreground: 'hsl(var(--primary-foreground))',
          100: '#b2dfcf',
          200: '#b2dfcf',
          300: '#b2dfcf',
          400: '#b2dfcf',
          500: '#02adc4',
          600: '#02adc4',
          700: '#008ab7',
          800: '#008ab7',
          900: '#008ab7',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
} satisfies Config;
