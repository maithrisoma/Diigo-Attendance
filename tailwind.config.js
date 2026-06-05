/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        border:  "hsl(var(--border) / <alpha-value>)",
        input:   "hsl(var(--input) / <alpha-value>)",
        ring:    "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT:    "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT:    "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        lilac: {
          50:  '#F9F5FF',
          100: '#F2EBFF',
          200: '#EDE9FE',
          300: '#DDD6FE',
          400: '#C4B5FD',
          500: '#A78BFA',
          600: '#8B5CF6',
          700: '#7C3AED',
          800: '#6D28D9',
          900: '#4C1D95',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        '2xl': "calc(var(--radius) + 8px)",
      },
      fontFamily: {
        sans:    ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        'lilac-sm': '0 2px 8px rgba(139,92,246,0.08)',
        'lilac':    '0 4px 24px rgba(139,92,246,0.12)',
        'lilac-lg': '0 8px 40px rgba(139,92,246,0.18)',
        'card':     '0 4px 24px rgba(139,92,246,0.08), 0 1px 4px rgba(196,181,253,0.15)',
        'glow':     '0 0 20px rgba(139,92,246,0.30)',
      },
      backgroundImage: {
        'lilac-gradient':    'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
        'lilac-soft':        'linear-gradient(135deg, #F7F2FF 0%, #EDE9FE 100%)',
        'lilac-hero':        'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 50%, #C4B5FD 100%)',
      },
      backdropBlur: {
        xs: '4px',
      },
      animation: {
        'float':      'float 5s ease-in-out infinite',
        'blob':       'blob 10s ease-in-out infinite',
        'fadeInUp':   'fadeInUp 0.4s ease forwards',
        'shimmer':    'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
