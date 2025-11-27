/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['"Open Sans"', "sans-serif"],
        geist: ["Geist", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      maxWidth: {
        "screen-1620": "1620px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),   // REQUIRED FOR SHADCN
  ],
};
