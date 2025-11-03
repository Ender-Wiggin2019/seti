import type { Config } from 'tailwindcss';

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
        anomalies: {
          DEFAULT: '#28b6af',
          foreground: '#9cd2d9',
          background: '#004c65',
        },
        centaurians: {
          DEFAULT: '#00a16c',
          foreground: '#9cd2b2',
          background: '#024d3f',
        },
        exertians: {
          DEFAULT: '#F5C4C0',
          foreground: '#F5C4C0',
          background: '#BE0505',
        },
        mascamites: {
          DEFAULT: '#ECE6C4',
          foreground: '#ECE6C4',
          background: '#A38815',
        },
        oumuamua: {
          DEFAULT: '#75509C',
          foreground: '#D6CAE2',
          background: '#333469',
        },
        amoeba: {
          DEFAULT: '#FFABEC',
          foreground: '#FFABEC',
        },
        glyphids: {
          DEFAULT: '#D2F504',
          foreground: '#D2F504',
          background: '#4C7B40',
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
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('tailwindcss-animate')],
} satisfies Config;
