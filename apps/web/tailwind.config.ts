import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        muted: "#556274",
        line: "#E2E8F0",
        canvas: "#F4F6F8",
        accent: { DEFAULT: "#0F766E", dark: "#115E59", soft: "#E6F4F1" },
      },
      fontFamily: { sans: ['"Instrument Sans"', "system-ui", "Segoe UI", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
