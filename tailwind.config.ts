import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-assistant)", "system-ui", "sans-serif"],
        serif: ["var(--font-frank-ruhl)", "Georgia", "serif"],
      },
      colors: {
        // בסיס נקי (כיוון 2)
        ink: {
          DEFAULT: "#0F172A",
          soft: "#334155",
          muted: "#64748B",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          soft: "#F7F8FA",
          warm: "#FAF6EE", // נגיעה מכיוון 1
        },
        border: {
          DEFAULT: "#E5E7EB",
          warm: "#E8DFC9",
        },
        // כחול ירושלים (פעולה ראשית)
        primary: {
          DEFAULT: "#1E40AF",
          hover: "#1E3A8A",
          soft: "#DBEAFE",
        },
        // זהב (הדגשות/לוח כבוד)
        gold: {
          DEFAULT: "#B8862F",
          soft: "#F5E9C8",
        },
        live: "#059669",
        danger: "#8B1E2D",
      },
      borderRadius: {
        card: "12px",
        btn: "10px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.03)",
        soft: "0 2px 8px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
