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
        forest: {
          50: '#f2f8f4',
          100: '#e1efe6',
          200: '#c5e0d0',
          300: '#9bcaa8',
          400: '#6cab7b',
          500: '#4a8d5b',
          600: '#387146',
          700: '#2f5b3a',
          800: '#264930',
          900: '#203d2a',
          950: '#112217',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
