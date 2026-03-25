export interface IThemeTokens {
  colors: {
    background: {
      950: string;
      900: string;
      800: string;
    };
    surface: {
      900: string;
      800: string;
      700: string;
    };
    text: {
      100: string;
      300: string;
      500: string;
    };
    accent: {
      500: string;
      400: string;
    };
    danger: {
      500: string;
    };
  };
  typography: {
    display: string;
    body: string;
  };
  effects: {
    panelShadow: string;
    overlayGradient: string;
  };
}

export const THEME_TOKENS: IThemeTokens = {
  colors: {
    background: {
      950: '#080d19',
      900: '#111a2e',
      800: '#1a2743',
    },
    surface: {
      900: '#101829',
      800: '#1a2845',
      700: '#2a3a59',
    },
    text: {
      100: '#f1f5f9',
      300: '#cbd5e1',
      500: '#94a3b8',
    },
    accent: {
      500: '#e2520e',
      400: '#f97316',
    },
    danger: {
      500: '#ef4444',
    },
  },
  typography: {
    display: 'Ubuntu',
    body: 'Ubuntu',
  },
  effects: {
    panelShadow: '0 18px 40px rgba(8, 13, 25, 0.45)',
    overlayGradient:
      'radial-gradient(1200px 600px at 10% -20%, rgba(226, 82, 14, 0.18), transparent 60%), radial-gradient(1200px 700px at 90% 120%, rgba(34, 211, 238, 0.12), transparent 55%)',
  },
};
