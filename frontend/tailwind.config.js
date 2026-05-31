/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6C63FF",
        ink: "#070914",
        panel: "#101320",
        line: "rgba(255,255,255,0.1)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(108,99,255,0.28), 0 18px 60px rgba(108,99,255,0.18)",
      },
    },
  },
  plugins: [],
};
