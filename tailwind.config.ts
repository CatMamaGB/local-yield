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
          DEFAULT: "#5D4524", // earthy brown
          light: "#F5F1E8", // parchment
          accent: "#8EAF62", // plant green
        },
      },
      fontFamily: {
        display: ["var(--font-display)", '"Playfair Display"', "serif"],
        body: ["var(--font-body)", '"Inter"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
