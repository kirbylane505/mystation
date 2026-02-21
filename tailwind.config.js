/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '10': 'repeat(10, minmax(0, 1fr))',
      },
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
        'display': ['var(--font-montserrat)', 'sans-serif'],
        'body': ['var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'navy-gradient': 'linear-gradient(135deg, #0a1628 0%, #1a2d4a 50%, #0a1628 100%)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
