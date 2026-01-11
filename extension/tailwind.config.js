/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Material Design 3 inspired colors (Chrome default-like)
        primary: {
          50: '#e8f0fe',
          100: '#d2e3fc',
          200: '#a7cbf2',
          500: '#1a73e8', // Google Blue
          600: '#1967d2',
          700: '#185abc',
        },
        surface: {
          50: '#f8f9fa',
          100: '#f1f3f4',
          200: '#e8eaed',
          300: '#dadce0',
        }
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'card-hover': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      }
    },
  },
  plugins: [],
}
