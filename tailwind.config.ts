// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // Critical for your ThemeToggle to work manually
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Mapping your custom CSS variables for cleaner usage
        brand: {
          dark: "var(--color-brand-dark)",   // #3f407e
          light: "var(--color-brand-light)", // #b3bbea
          black: "var(--color-brand-black)", // #191b19
        }
      },
      fontFamily: {
        // This connects to the variable in your Layout.tsx
        sans: ["var(--font-geist-sans)", "Arial", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        spartan: ["var(--font-league-spartan)", "sans-serif"], 
      },
    },
  },
  plugins: [],
};

export default config;