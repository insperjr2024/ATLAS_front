/** Breakpoints para media queries (use max-width para mobile-first) */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const theme = {
  breakpoints,
  colors: {
    // Base colors
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(0, 0%, 10%)',

    // Card
    card: 'hsl(0, 0%, 100%)',
    cardForeground: 'hsl(0, 0%, 10%)',

    // Primary - Red accent
    primary: 'hsl(0, 72%, 51%)',
    primaryForeground: 'hsl(0, 0%, 100%)',

    // Secondary - Light gray
    secondary: 'hsl(0, 0%, 96%)',
    secondaryForeground: 'hsl(0, 0%, 10%)',

    // Muted
    muted: 'hsl(0, 0%, 96%)',
    mutedForeground: 'hsl(0, 0%, 45%)',

    // Accent - Same as primary (red)
    accent: 'hsl(0, 72%, 51%)',
    accentForeground: 'hsl(0, 0%, 100%)',

    // Destructive
    destructive: 'hsl(0, 72%, 51%)',
    destructiveForeground: 'hsl(0, 0%, 100%)',

    // Success
    success: 'hsl(142, 71%, 45%)',
    successForeground: 'hsl(0, 0%, 100%)',

    // Borders
    border: 'hsl(0, 0%, 90%)',
    input: 'hsl(0, 0%, 90%)',
    ring: 'hsl(0, 72%, 51%)',
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },

  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },

  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
};

export type Theme = typeof theme;
