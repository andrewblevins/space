/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        term: {
          50:  '#fdf8f3',
          100: '#f9ede0',
          200: '#f0d4b8',
          300: '#e4b589',
          400: '#d4956a',
          500: '#b87333',
          600: '#9a5f2a',
          700: '#7a4a21',
          800: '#5c3818',
          900: '#422810',
          950: '#2a1a0a',
        },
      },
      fontFamily: {
        'serif': ['Vollkorn', 'serif'],
        'vollkorn': ['Vollkorn', 'serif'],
        'sans': ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        'jakarta': ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}