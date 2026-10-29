import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/routes/**/*.{js,ts,jsx,tsx}',
    './src/components/layout/**/*.{js,ts,jsx,tsx}',
    './src/components/ui/**/*.{js,ts,jsx,tsx}',
    './src/components/wellbeing/**/*.{js,ts,jsx,tsx}',
    './src/context/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#32617d',
        'primary-container': '#4c7a97',
        'on-primary': '#ffffff',
        'on-primary-container': '#fcfcff',
        'primary-fixed': '#c7e7ff',
        'primary-fixed-dim': '#9fcced',
        'on-primary-fixed': '#001e2e',
        'on-primary-fixed-variant': '#194b67',
        'inverse-primary': '#9fcced',

        'secondary': '#486730',
        'secondary-container': '#c9eea9',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#4e6d36',
        'secondary-fixed': '#c9eea9',
        'secondary-fixed-dim': '#aed18f',
        'on-secondary-fixed': '#0b2000',
        'on-secondary-fixed-variant': '#314e1b',

        'tertiary': '#735802',
        'tertiary-container': '#8e711f',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#fffbff',
        'tertiary-fixed': '#ffdf96',
        'tertiary-fixed-dim': '#e7c268',
        'on-tertiary-fixed': '#251a00',
        'on-tertiary-fixed-variant': '#5a4400',

        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        'background': '#f0f3fa',
        'on-background': '#0f172a',

        'surface': '#f0f3fa',
        'surface-dim': '#e2e8f0',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f8fafc',
        'surface-container': '#f1f5f9',
        'surface-container-high': '#e2e8f0',
        'surface-container-highest': '#cbd5e1',
        'surface-variant': '#e2e8f0',
        'surface-tint': '#356380',

        'on-surface': '#0f172a',
        'on-surface-variant': '#475569',
        'inverse-surface': '#1e293b',
        'inverse-on-surface': '#f8fafc',

        'outline': '#71787e',
        'outline-variant': '#c1c7cd',

        // Legacy brand alias compatibility
        brand: {
          50: '#f0f6fa',
          100: '#e1edf5',
          200: '#c7e7ff',
          300: '#9fcced',
          400: '#5d8aa8',
          500: '#32617d',
          600: '#32617d',
          700: '#234a62',
          800: '#193547',
          900: '#0f222e',
        },
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      spacing: {
        'touch-target-min': '44px',
        'container-padding-mobile': '20px',
        'unit': '8px',
        'container-padding-desktop': '40px',
        'section-gap': '48px',
        'gutter': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        'label-caps': ['Inter', 'sans-serif'],
        'display-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'interactive': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
