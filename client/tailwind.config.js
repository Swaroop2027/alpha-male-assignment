/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#0ea5e9', // Performance Blue
          600: '#0284c7',
          700: '#0369a1',
          gold: '#eab308', // Premium accent gold
          dark: '#090d16', // Core Alpha background dark
          card: '#0f172a', // Slate 900
          border: '#1e293b' // Slate 800
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

