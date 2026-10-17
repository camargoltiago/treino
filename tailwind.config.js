/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: 'rgb(var(--color-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          card: 'rgb(var(--color-card) / <alpha-value>)',
          cardHover: 'rgb(var(--color-card-hover) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          borderLight: 'rgb(var(--color-border-light) / <alpha-value>)',
        },
        mint: {
          50: '#E6FCF5',
          100: '#C2F9E8',
          200: '#8CF5D4',
          300: '#4DEEBD',
          400: 'rgb(var(--color-mint-400) / <alpha-value>)',
          500: 'rgb(var(--color-mint-500) / <alpha-value>)',
          600: '#00BF7F',
          700: '#009462',
          800: '#006E49',
          900: '#004F34',
        }
      },
      boxShadow: {
        'mint-glow': '0 0 25px -5px rgba(0, 229, 153, 0.35)',
        'mint-glow-sm': '0 0 15px -3px rgba(0, 229, 153, 0.25)',
      }
    },
  },
  plugins: [],
}
