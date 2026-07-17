import type { Config } from "tailwindcss";

/**
 * Swasthya Rakshak design system.
 * Colours are driven by CSS variables defined in src/app/globals.css so the
 * whole palette can be re-themed in one place. `<alpha-value>` lets utilities
 * like `bg-primary-600/30` work.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      },
      colors: {
        primary: shades("primary"),
        secondary: shades("secondary"),
        accent: shades("accent"),
        success: shades("success"),
        warning: shades("warning"),
        error: shades("error"),
        gray: shades("gray")
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        beat: "beat 1.2s ease-out infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        beat: {
          "0%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.1)" },
          "40%": { transform: "scale(1)" },
          "60%": { transform: "scale(1.05)" },
          "75%": { transform: "scale(1)" }
        }
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};

/** Build the 50–950 scale for a colour family backed by CSS variables. */
function shades(name: string): Record<string, string> {
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  return Object.fromEntries(
    steps.map((step) => [step, `rgb(var(--${name}-${step}) / <alpha-value>)`])
  );
}

export default config;
