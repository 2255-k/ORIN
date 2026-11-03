/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
        },
      },
      boxShadow: {
        panel: "0 12px 40px rgba(0,0,0,0.28)",
      },
    },
  },
  plugins: [],
};
