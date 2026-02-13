/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#f7f1e7",
        panel: "#fffaf2",
        panelStrong: "#ffffff",
        ink: "#1d1a16",
        muted: "#6e675f",
        accent: "#0f766e",
        accentSoft: "#e2f2f0",
        accent2: "#f4b860",
        stroke: "#e6dfd3"
      },
      boxShadow: {
        soft: "0 24px 60px rgba(31, 26, 18, 0.12)"
      }
    }
  },
  plugins: []
};
