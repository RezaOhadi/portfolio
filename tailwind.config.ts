import type { Config } from "tailwindcss";

/**
 * Design system — "Black & white piano".
 * Deep matte black, warm ivory, soft charcoal, metallic silver. Grayscale only.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0A0A0C",
          deep: "#060608",
          950: "#060608",
          900: "#0A0A0C",
          800: "#121215",
          700: "#1A1A1F",
        },
        charcoal: {
          DEFAULT: "#232329",
          900: "#1C1C21",
          700: "#2C2C33",
          500: "#3A3A42",
          300: "#55555F",
        },
        ivory: {
          DEFAULT: "#F2EEE6",
          50: "#FAF8F3",
          100: "#F2EEE6",
          200: "#E7E1D4",
          300: "#D8D1C0",
        },
        silver: {
          DEFAULT: "#B9B9C2",
          400: "#9A9AA6",
          300: "#B9B9C2",
          200: "#CFCFD6",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.25em",
        editorial: "0.32em",
      },
      fontSize: {
        display: ["clamp(3.5rem, 12vw, 11rem)", { lineHeight: "0.92", letterSpacing: "-0.02em" }],
        "display-sm": ["clamp(2.5rem, 7vw, 5rem)", { lineHeight: "1.0", letterSpacing: "-0.01em" }],
      },
      maxWidth: {
        editorial: "78rem",
        prose: "42rem",
      },
      transitionTimingFunction: {
        // A calm, expensive ease — used everywhere for consistency.
        cinematic: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "key-fall": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "100%": { transform: "scaleY(1)", transformOrigin: "top" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.6" },
        },
        "light-drift": {
          "0%": { transform: "translate3d(-6%, -2%, 0) scale(1.05)" },
          "100%": { transform: "translate3d(6%, 3%, 0) scale(1.1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.9s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 2.5s linear infinite",
        "soft-pulse": "soft-pulse 6s ease-in-out infinite",
        "light-drift": "light-drift 24s ease-in-out infinite alternate",
      },
      backgroundImage: {
        "ivory-sheen":
          "linear-gradient(90deg, transparent, rgba(242,238,230,0.08), transparent)",
        "hall-glow":
          "radial-gradient(120% 80% at 50% -10%, rgba(242,238,230,0.10), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
