/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rer: {
          app: "#F5F7FA",
          card: "#FFFFFF",
          editorial: "#F7F3E2",
          blue: "#243B8F",
          orange: "#F1663C",
          text: "#111827",
          muted: "#4B5563",
          subtle: "#9CA3AF",
          border: "#E5E7EB",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

