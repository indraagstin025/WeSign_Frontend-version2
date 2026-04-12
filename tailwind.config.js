/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'], 
  theme: {
    extend: {
      colors: {
        primary: {
          light: 'hsl(160, 60%, 95%)',
          DEFAULT: 'hsl(160, 60%, 40%)',
          dark: 'hsl(160, 60%, 30%)',
          darker: 'hsl(160, 60%, 15%)',
        },
        accent: 'hsl(43, 74%, 60%)',
        surface: {
          light: 'hsl(140, 20%, 98%)',
          white: 'hsl(0, 0%, 100%)',
          dark: 'hsl(220, 25%, 10%)',
          black: 'hsl(220, 20%, 12%)',
          card: 'hsl(220, 20%, 14%)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        dancing: ['Dancing Script', 'cursive'],
        caveat: ['Caveat', 'cursive'],
        sacramento: ['Sacramento', 'cursive'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
