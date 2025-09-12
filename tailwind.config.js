// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This line scans all relevant files in your src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}