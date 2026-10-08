/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        smv: {
          50: '#F5F4FF',
          100: '#EBE9FE',
          200: '#DDD9FE',
          300: '#C4BCFD',
          400: '#A294FA',
          500: '#7C67F6',
          600: '#5E56E7', // Exact StampMyVisa Primary Violet/Purple
          700: '#4F46E5',
          800: '#3F37C9',
          900: '#2E278B',
          bg: '#FAFAFC',
          sidebar: '#F4F5F7',
          border: '#E5E7EB',
        },
        brand: {
          50: '#F5F4FF',
          100: '#EBE9FE',
          500: '#5E56E7',
          600: '#4F46E5',
          700: '#3F37C9',
        },
      },
    },
  },
  plugins: [],
}
