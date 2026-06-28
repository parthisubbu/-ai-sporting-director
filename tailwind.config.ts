import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#0A0D1A",
        sidebar: "#080B14",
        card:    "#0E1325",
        border:  "rgba(255,255,255,0.055)",
        accent:  "#00FF41",
        "accent-dark": "#00D93D",
        red:     "#EC1C24",
        pitch:   "#1a6b3c",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0, 255, 65, 0.2)" },
          "50%": { boxShadow: "0 0 15px rgba(0, 255, 65, 0.4)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out",
        slideUp: "slideUp 0.5s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s infinite",
        glow: "glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
