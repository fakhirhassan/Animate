import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ── Color System ── */
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface)",
          high: "var(--surface-high)",
          low: "var(--surface-low)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        highlight: {
          DEFAULT: "var(--highlight)",
          foreground: "var(--highlight-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        warning: "var(--warning)",
        success: "var(--success)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        /* Static palette for direct use */
        void: {
          black: "#080810",
          deep: "#0e0e1a",
          surface: "#111124",
          elevated: "#1A1A35",
          border: "#2A2A4A",
          muted: "#6B6B99",
          text: "#EEEEFF",
        },
        neon: {
          violet: "#6D28D9",
          cyan: "#10F0B0",
          pink: "#F000FF",
          danger: "#FF3B5C",
          warning: "#FFAA00",
          success: "#00E096",
        },
        light: {
          bg: "#F2F2F7",
          surface: "#FFFFFF",
          elevated: "#E8E8F0",
          border: "#D1D1E0",
          muted: "#6B7280",
          text: "#0A0A1F",
          violet: "#5B21B6",
          cyan: "#059669",
          pink: "#C026D3",
        },
      },

      /* ── Font Families ── */
      fontFamily: {
        headline: ["var(--font-headline)", "Orbitron", "sans-serif"],
        body: ["var(--font-body)", "DM Sans", "sans-serif"],
        label: ["var(--font-label)", "Space Mono", "monospace"],
      },

      /* ── Border Radius ── */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      /* ── Animations ── */
      animation: {
        "blob-drift": "blob-drift 20s ease-in-out infinite",
        "blob-drift-delayed": "blob-drift 25s ease-in-out 5s infinite",
        "blob-drift-slow": "blob-drift 30s ease-in-out 10s infinite",
        shimmer: "shimmer 2s linear infinite",
        "pulse-ring": "pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.8s ease-out forwards",
        "scale-in": "scale-in 0.5s ease-out forwards",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "float-particle": "float-particle 20s linear infinite",
        "spin-slow": "spin-slow 20s linear infinite",
      },

      /* ── Keyframes ── */
      keyframes: {
        "blob-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "25%": { transform: "translate(30px, -50px) scale(1.1)" },
          "50%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "75%": { transform: "translate(40px, 10px) scale(1.05)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "33%": { transform: "translateY(-20px) translateX(10px)" },
          "66%": { transform: "translateY(-10px) translateX(-10px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "float-particle": {
          "0%": {
            transform: "translateY(100vh) translateX(0) rotate(0deg)",
            opacity: "0",
          },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": {
            transform: "translateY(-100vh) translateX(100px) rotate(360deg)",
            opacity: "0",
          },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },

      /* ── Backdrop Blur ── */
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
