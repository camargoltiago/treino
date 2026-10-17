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
          bg: '#080B11',
          surface: '#0F1622',
          card: '#151E2E',
          cardHover: '#1B273A',
          border: '#1F2C42',
          borderLight: '#2A3B56',
        },
        mint: {
          50: '#E6FCF5',
          100: '#C2F9E8',
          200: '#8CF5D4',
          300: '#4DEEBD',
          400: '#1DE8A8',
          500: '#00E599',
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
