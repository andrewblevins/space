/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Vollkorn', 'serif'],
        'vollkorn': ['Vollkorn', 'serif'],
      },
    },
  },
  plugins: [],
}