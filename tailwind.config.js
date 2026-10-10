/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./**/*.html', './src/**/*.{js,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EAF1FF',
          100: '#D6E3FA',
          500: '#2864DC',
          600: '#1D4FB5',
          700: '#153A8A'
        },
        surface: {
          light: '#FFFFFF',
          dark: '#151F30',
          elevated: '#1D2A3D'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
