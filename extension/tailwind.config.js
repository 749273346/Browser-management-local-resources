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
        // Use CSS variables for dynamic theming
        primary: {
          DEFAULT: 'var(--color-primary)',
          container: 'var(--color-primaryContainer)',
          on: 'var(--color-onPrimary)',
          'on-container': 'var(--color-onPrimaryContainer)',
          // Fallbacks/Shades for legacy support if needed
          50: '#e8f0fe',
          100: '#d2e3fc',
          200: '#a7cbf2',
          500: 'var(--color-primary)', 
          600: '#1967d2',
          700: '#185abc',
        },
        secondary: {
            DEFAULT: 'var(--color-secondary)',
            container: 'var(--color-secondaryContainer)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          variant: 'var(--color-surfaceVariant)',
          50: 'var(--color-surface)', // Mapping old usage
          100: '#f1f3f4',
        }
      },
      backgroundImage: {
        'theme-gradient': 'var(--bg-gradient)',
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
