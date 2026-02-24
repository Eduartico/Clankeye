/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        noto: ["Noto Sans", "sans-serif"],
      },

      /* ─── Glass / liquid-surface colour system ─────────────────────── *
       * Primary is exposed as HSL triplets via CSS variables so
       * shadcn/ui, Tailwind, and custom glass styles all share one
       * source of truth.  Primary = accent only, NEVER surface fill.
       * ─────────────────────────────────────────────────────────────── */
      colors: {
        /* HSL-based primary (accent use only) */
        primary: {
          DEFAULT: "hsl(var(--color-primary) / <alpha-value>)",
          light: "hsl(var(--color-primary-light) / <alpha-value>)",
          dark: "hsl(var(--color-primary-dark) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },

        /* Theme CSS variable colour scales — backward compat */
        "primary-scale": {
          50: "var(--color-primary-50, #fff7ed)",
          100: "var(--color-primary-100, #ffedd5)",
          200: "var(--color-primary-200, #fed7aa)",
          300: "var(--color-primary-300, #fdba74)",
          400: "var(--color-primary-400, #fb923c)",
          500: "var(--color-primary-500, #f97316)",
          600: "var(--color-primary-600, #ea580c)",
          700: "var(--color-primary-700, #c2410c)",
          800: "var(--color-primary-800, #9a3412)",
          900: "var(--color-primary-900, #7c2d12)",
          950: "var(--color-primary-950, #431407)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          50: "var(--color-secondary-50, #f8fafc)",
          100: "var(--color-secondary-100, #f1f5f9)",
          200: "var(--color-secondary-200, #e2e8f0)",
          300: "var(--color-secondary-300, #cbd5e1)",
          400: "var(--color-secondary-400, #94a3b8)",
          500: "var(--color-secondary-500, #64748b)",
          600: "var(--color-secondary-600, #475569)",
          700: "var(--color-secondary-700, #334155)",
          800: "var(--color-secondary-800, #1e293b)",
          900: "var(--color-secondary-900, #0f172a)",
          950: "var(--color-secondary-950, #020617)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          50: "var(--color-accent-50, #fdf4ff)",
          100: "var(--color-accent-100, #fae8ff)",
          200: "var(--color-accent-200, #f5d0fe)",
          300: "var(--color-accent-300, #f0abfc)",
          400: "var(--color-accent-400, #e879f9)",
          500: "var(--color-accent-500, #d946ef)",
          600: "var(--color-accent-600, #c026d3)",
          700: "var(--color-accent-700, #a21caf)",
          800: "var(--color-accent-800, #86198f)",
          900: "var(--color-accent-900, #701a75)",
          950: "var(--color-accent-950, #4a044e)",
        },
        /* shadcn semantic tokens */
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",

        /* Semantic background colors */
        background: {
          DEFAULT: "hsl(var(--background) / <alpha-value>)",
          default: "var(--color-background-default, #f8fafc)",
          paper: "var(--color-background-paper, #ffffff)",
          elevated: "var(--color-background-elevated, #f1f5f9)",
        },
        foreground: {
          DEFAULT: "hsl(var(--foreground) / <alpha-value>)",
        },
        /* Semantic text colors */
        text: {
          primary: "var(--color-text-primary, #0f172a)",
          secondary: "var(--color-text-secondary, #475569)",
          disabled: "var(--color-text-disabled, #94a3b8)",
          inverse: "var(--color-text-inverse, #f8fafc)",
        },
        /* Semantic border colors */
        border: {
          DEFAULT: "hsl(var(--border) / <alpha-value>)",
          default: "var(--color-border-default, #e2e8f0)",
          light: "var(--color-border-light, #f1f5f9)",
          focus: "var(--color-border-focus, #f97316)",
        },
        /* Legacy brand colours */
        lochmara: {
          50: "#f2f8fd", 100: "#e4effa", 200: "#c3dff4",
          300: "#8fc5ea", 400: "#53a7dd", 500: "#2980b9",
          600: "#1e6fab", 700: "#19598b", 800: "#194c73",
          900: "#1a4060", 950: "#112940",
        },
        monza: {
          50: "#fef2f3", 100: "#fee2e3", 200: "#fecacc",
          300: "#fba6aa", 400: "#f77278", 500: "#ed464d",
          600: "#da2830", 700: "#c11f26", 800: "#981c21",
          900: "#7e1e22", 950: "#440b0d",
        },
        thunderbird: {
          50: "#fff5ed", 100: "#fee9d6", 200: "#fcd0ac",
          300: "#f9ae78", 400: "#f68241", 500: "#f3601c",
          600: "#e44612", 700: "#b23010", 800: "#962a16",
          900: "#792515", 950: "#411009",
        },
      },

      /* shadcn border-radius tokens */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      screens: {
        sm: "640px",
        md: "768px",
        cl: "900px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },

      /* Glass animation keyframes */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
