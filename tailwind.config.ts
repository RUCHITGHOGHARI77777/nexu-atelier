import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#09090b",
          canvas: "#060608",
          surface: "#0f0f12",
          elevated: "#18181d",
          border: "#27272a",
          subtle: "#3f3f46",
        },
        ochre: {
          DEFAULT: "#c28832",
          light: "#d4a359",
          hover: "#aa7427",
          dark: "#825417",
          muted: "rgba(194, 136, 50, 0.12)",
        },
        brand: {
          gold: "#c28832",
          "gold-light": "#d4a359",
          amber: "#c28832",
          accent: "#c28832",
          emerald: "#10b981", // for positive status indicators
        },
        atelier: {
          surface: "#FFFFFF",
          canvas: "#FAFAF8",
          section: "#F5F6F4",
          border: "#E8E8E4",
          "border-strong": "#D4D4CF",
          charcoal: "#171717",
          slate: "#626262",
          muted: "#767676",
          gold: "#B78B45",
          "gold-soft": "#F8F2E6",
          "gold-dark": "#8A631E",
          emerald: "#21866F",
          "emerald-soft": "#EAF6F0",
          rose: "#C2410C",
          "rose-soft": "#FDF2E9",
        },
      },
      transitionTimingFunction: {
        fluid: "cubic-bezier(0.16, 1, 0.3, 1)",
        "fluid-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      fontFamily: {
        sans: [
          "var(--font-manrope)",
          "var(--font-inter)",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "Times",
          "serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
        card: "0 4px 16px -2px rgba(0, 0, 0, 0.5)",
        elevated: "0 12px 32px -4px rgba(0, 0, 0, 0.7)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
