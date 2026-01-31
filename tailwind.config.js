/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'mystation': {
          navy: '#0a1628',
          navyLight: '#1a2d4a',
          navyDark: '#050d18',
          darker: '#020617',
          blue: '#3b82f6',
          blueLight: '#60a5fa',
          accent: '#1e40af',
          black: '#030712',
          white: '#f8fafc',
        }
      },
      fontFamily: {
        'display': ['Montserrat', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'navy-gradient': 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 50%, #0a1628 100%)',
      }
    },
  },
  plugins: [],
}
