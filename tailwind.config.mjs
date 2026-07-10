/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,sgn,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf8eb',
          100: '#f6eed0',
          200: '#eddca1',
          300: '#dec26c',
          400: '#cda43c',
          500: '#D4AF37', // Gold main accent
          600: '#b48a27',
          700: '#946a1f',
          800: '#79551e',
          900: '#68471f',
          950: '#3c250e',
        },
        celeste: {
          50: '#f2f8fc',
          100: '#e2f0fa',
          200: '#cbe2f4',
          300: '#a7ceeb',
          400: '#7bb0e0',
          500: '#74ACDF', // Argentine Celeste main accent
          600: '#3e7abf',
          700: '#32629b',
          800: '#2d5381',
          900: '#2a476c',
          950: '#1a2c46',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
