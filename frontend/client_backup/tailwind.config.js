module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class', // class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f8ff',
          100: '#dbeeff',
          200: '#b7ddff',
          300: '#7fc0ff',
          400: '#4098ff',
          500: '#1a73ff', // main primary
          600: '#0f5fe6',
          700: '#0b48b3',
          800: '#083586',
          900: '#04224d'
        },
        accent: {
          50: '#fff8f6',
          100: '#ffefe9',
          200: '#ffd8c9',
          300: '#ffb89a',
          400: '#ff8f66',
          500: '#ff6b3b'
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#111827'
        }
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        28: '7rem'
      },
      borderRadius: {
        xl: '1rem'
      },
      boxShadow: {
        card: '0 6px 24px rgba(16,24,40,0.08)',
        soft: '0 2px 10px rgba(16,24,40,0.06)'
      },
      // ✨ ADD THESE ANIMATIONS BELOW ✨
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};