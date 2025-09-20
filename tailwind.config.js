// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // ALTERADO: Paleta de azul para laranja
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Laranja principal
          600: '#ea580c', // Laranja mais escuro para hover
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        }
      },
      animation: {
        'modal': 'modalAppear 0.15s ease-out'
      },
      keyframes: {
        modalAppear: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}