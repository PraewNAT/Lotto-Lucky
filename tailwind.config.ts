import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // surfaces
        bg: "#FBFBFD",
        surface: "#FFFFFF",
        "surface-2": "#F4F5F8",
        "surface-3": "#EDEEF1",
        // text
        ink: "#08090A",
        "ink-2": "#3C3F44",
        muted: "#6B6F76",
        subtle: "#9094A0",
        // borders
        line: "#E6E7EB",
        "line-strong": "#D0D2D8",
        "line-subtle": "#EFF0F3",
        // accent
        accent: {
          DEFAULT: "#5E6AD2",
          hover: "#4F5BC4",
          soft: "#EEF0FB",
          text: "#3D47A6",
        },
        success: { DEFAULT: "#22A06B", soft: "#E6F5EE" },
        warning: { DEFAULT: "#D9851A", soft: "#FCF0DC" },
        danger: { DEFAULT: "#D24A56", soft: "#FBE9EB" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-prompt)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tight2: "-0.015em",
        tight3: "-0.02em",
      },
      borderRadius: {
        DEFAULT: "8px",
      },
      boxShadow: {
        raised:
          "0 1px 2px rgba(8, 9, 10, 0.04), 0 4px 12px rgba(8, 9, 10, 0.04)",
        floating: "0 8px 24px rgba(8, 9, 10, 0.08)",
        focus: "0 0 0 3px rgba(94, 106, 210, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
