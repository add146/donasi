/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        serif: ["Merriweather", "ui-serif", "Georgia"],
      },
      colors: {
        // ---- level atas (utility langsung) ----
        primary: "#00695C",
        accent: {
          DEFAULT: "#F4B400",
          bright:  "#FFC928", },
        hero:    "#6E8581", 
        orange:  "#BF360C",
        purple:  "#6A1B9A",
        brown:   "#4E342E",
        blue:    "#1565C0",
        red:     "#C62828",

        // ---- alias 'brand' (kalau di komponen pakai text-brand-*) ----
        brand: {
          primary: "#00695C",
          accent:  "#F4B400",
          hero:    "#6E8581",
          orange:  "#BF360C",
          purple:  "#6A1B9A",
          brown:   "#4E342E",
          blue:    "#1565C0",
          red:     "#C62828",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/line-clamp"),
  ],
};
