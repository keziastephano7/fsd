/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#BF40BF',        // Bright Purple
        secondary: '#702963',      // Byzantium
        accent: '#AA336A',         // Dark Pink
        deepPurple: '#9F2B68',     // Deep Purple
        error: '#800020',           // Burgundy
        darkText: '#301934',       // Dark Purple text
        lightGray: '#FAFAFA',      // App background
        muted: '#9E9E9E',          // Secondary text
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        card: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
