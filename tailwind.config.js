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
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#0F172A',
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
        'lilac-sm': '0 2px 8px rgba(37,99,235,0.06)',
        'lilac':    '0 4px 24px rgba(37,99,235,0.10)',
        'lilac-lg': '0 8px 40px rgba(37,99,235,0.15)',
        'card':     '0 4px 24px rgba(37,99,235,0.06), 0 1px 4px rgba(96,165,250,0.10)',
        'glow':     '0 0 20px rgba(37,99,235,0.25)',
      },
      backgroundImage: {
        'lilac-gradient':    'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)',
        'lilac-soft':        'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        'lilac-hero':        'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 50%, #CBD5E1 100%)',
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
