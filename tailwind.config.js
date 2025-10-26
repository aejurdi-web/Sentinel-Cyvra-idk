/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/renderer/**/*.{tsx,ts,jsx,js}", "./index.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1F6FEB",
          dark: "#153E75"
        },
        danger: "#ef4444",
        success: "#22c55e"
      }
    }
  },
  plugins: []
};
