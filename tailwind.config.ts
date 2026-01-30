import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep space blacks - pure dark foundation
        space: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          850: '#1c1c1f',
          900: '#141416',
          950: '#0a0a0b',
        },
        // Stellar Silver - metallic accent with cool undertones
        silver: {
          DEFAULT: '#9ca3af',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Ice Cyan - subtle cool accent for highlights
        ice: {
          DEFAULT: '#67e8f9',
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // Primary uses CSS variables for theme switching
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'hsl(var(--primary-50))',
          100: 'hsl(var(--primary-100))',
          200: 'hsl(var(--primary-200))',
          300: 'hsl(var(--primary-300))',
          400: 'hsl(var(--primary-400))',
          500: 'hsl(var(--primary-500))',
          600: 'hsl(var(--primary-600))',
          700: 'hsl(var(--primary-700))',
          800: 'hsl(var(--primary-800))',
          900: 'hsl(var(--primary-900))',
          950: 'hsl(var(--primary-950))',
        },
        // Accent - silver metallic for secondary highlights
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        anomalies: {
          DEFAULT: '#2dd4bf',
          foreground: '#ccfbf1',
          background: '#115e59',
          dark: '#0d9488',
        },
        centaurians: {
          DEFAULT: '#10b981',
          foreground: '#d1fae5',
          background: '#065f46',
          dark: '#047857',
        },
        exertians: {
          DEFAULT: '#ef4444',
          foreground: '#fee2e2',
          background: '#991b1b',
          dark: '#dc2626',
        },
        mascamites: {
          DEFAULT: '#eab308',
          foreground: '#fef9c3',
          background: '#854d0e',
          dark: '#ca8a04',
        },
        oumuamua: {
          DEFAULT: '#8b5cf6',
          foreground: '#ede9fe',
          background: '#5b21b6',
          dark: '#7c3aed',
        },
        amoeba: {
          DEFAULT: '#f472b6',
          foreground: '#fce7f3',
          dark: '#ec4899',
        },
        glyphids: {
          DEFAULT: '#84cc16',
          foreground: '#ecfccb',
          background: '#3f6212',
          dark: '#65a30d',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
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
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      text: {
        xxs: 'font-size: 0.6rem;line-height: 0.8rem;',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        float: 'float 3s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'metallic-shine': 'metallic-shine 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': {
            boxShadow:
              '0 0 5px hsl(var(--primary-500)), 0 0 10px hsl(var(--primary-500) / 0.5)',
          },
          '50%': {
            boxShadow:
              '0 0 10px hsl(var(--primary-500)), 0 0 20px hsl(var(--primary-500) / 0.5)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'metallic-shine': {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
      backgroundImage: {
        'metallic-gradient':
          'linear-gradient(135deg, #1f2937 0%, #374151 25%, #9ca3af 50%, #374151 75%, #1f2937 100%)',
        'metallic-shine':
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        'space-gradient':
          'radial-gradient(ellipse at center, #141416 0%, #0a0a0b 100%)',
      },
      boxShadow: {
        metallic:
          '0 0 20px rgba(156, 163, 175, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'metallic-lg':
          '0 0 40px rgba(156, 163, 175, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        'glow-ice': '0 0 20px rgba(103, 232, 249, 0.3)',
        'glow-silver': '0 0 20px rgba(156, 163, 175, 0.3)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('tailwindcss-animate')],
} satisfies Config;
