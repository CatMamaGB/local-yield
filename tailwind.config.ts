import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#5D4524", // deep warm brown (headings, primary text)
          light: "#F7F3EB", // warm off-white (page bg)
          accent: "#6B7B5C", // muted olive (primary buttons, links)
          "accent-bright": "#8EAF62", // plant green (badges, highlights)
          terracotta: "#B8735C", // soft terracotta (destructive, alerts)
          "warm-gray": "#6B6359", // muted warm gray (secondary text)
        },
      },
      fontFamily: {
        display: ["var(--font-display)", '"Playfair Display"', "serif"],
        body: ["var(--font-body)", '"Inter"', "sans-serif"],
      },
      boxShadow: {
        "farmhouse": "0 1px 3px 0 rgb(93 69 36 / 0.06), 0 1px 2px -1px rgb(93 69 36 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
