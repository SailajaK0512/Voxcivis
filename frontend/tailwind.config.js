/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#95bedc',
          400: '#5f9ec8',
          500: '#3b82b3',
          600: '#2b6896',
          700: '#23537a',
          800: '#1e4463',
          900: '#0f273b',
          950: '#0a1a27',
        },
        municipal: {
          slate: '#1e293b',
          dark: '#0f172a',
          surface: '#f8fafc',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
